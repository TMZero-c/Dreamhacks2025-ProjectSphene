const openai = require('../config/openaiConfig');

/**
 * Generate suggestions based on comparing notes
 */
exports.generateSuggestions = async (targetNote, otherNotes) => {
    console.log(`Generating suggestions for note ID: ${targetNote._id}, title: "${targetNote.title}"`);
    console.log(`Comparing with ${otherNotes.length} other notes`);

    if (!targetNote.content) {
        console.warn('Target note has no content');
        return [];
    }

    // Parse the content if needed
    let targetContent = targetNote.content;
    try {
        // Check if the content is JSON and needs parsing
        if (typeof targetContent === 'string' &&
            (targetContent.startsWith('{') || targetContent.startsWith('['))) {
            console.log('Parsing target note content as JSON');
            targetContent = JSON.parse(targetContent);
        }
    } catch (error) {
        console.error('Error parsing target note content:', error);
        // Continue with the original content
    }

    const suggestions = [];

    // Process each note for comparison
    for (const sourceNote of otherNotes) {
        try {
            if (!sourceNote.content) {
                console.warn(`Source note from user ${sourceNote.userId} has no content, skipping`);
                continue;
            }

            console.log(`Comparing with note from user: ${sourceNote.userId}`);

            // Create a prompt for OpenAI to compare documents
            const prompt = createComparisonPrompt(
                targetNote.content,
                sourceNote.content,
                targetNote.title,
                sourceNote.title
            );

            // Call OpenAI API with the prompt
            console.log('Calling OpenAI API...');
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: `You are an assistant that identifies key information present in Document B 
                          but missing from Document A. Generate concise suggestions for improving Document A.
                          Each suggestion should include a title and content formatted as a Quill Delta object.`
                        },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1500 // allows full JSON response
                });

                // Check for valid response
                const messageContent = response.choices &&
                    response.choices[0] &&
                    response.choices[0].message &&
                    response.choices[0].message.content;

                if (!messageContent) {
                    console.warn('No message content received from OpenAI');
                    continue;
                }

                console.log('Received response from OpenAI:',
                    messageContent.substring(0, 100) + '...');

                // Parse the response and create suggestion objects
                const noteId = targetNote._id.toString();
                const suggestionsFromResponse = parseSuggestionsFromResponse(
                    messageContent,
                    noteId,
                    sourceNote.userId
                );

                console.log(`Generated ${suggestionsFromResponse.length} suggestions from this comparison`);
                suggestions.push(...suggestionsFromResponse);

            } catch (apiError) {
                console.error('OpenAI API error:', apiError);
                console.log('Continuing with other notes despite API error');
            }

        } catch (error) {
            console.error('Error processing source note:', error);
            // Continue with other notes even if one comparison fails
        }
    }

    console.log(`Total suggestions generated: ${suggestions.length}`);
    return suggestions;
};

/**
 * Create a prompt for the OpenAI API to compare two documents
 */
function createComparisonPrompt(documentA, documentB, titleA = '', titleB = '') {
    // Parse JSON content if necessary
    let contentA = documentA;
    let contentB = documentB;

    try {
        if (typeof documentA === 'string' &&
            (documentA.startsWith('{') || documentA.startsWith('['))) {
            const parsedA = JSON.parse(documentA);
            contentA = extractTextFromQuillDelta(parsedA);
        }

        if (typeof documentB === 'string' &&
            (documentB.startsWith('{') || documentB.startsWith('['))) {
            const parsedB = JSON.parse(documentB);
            contentB = extractTextFromQuillDelta(parsedB);
        }
    } catch (error) {
        console.error('Error parsing document content:', error);
        // Continue with original content if parsing fails
    }

    // Use titles in the prompt if available
    const titleText = titleA && titleB ?
        `Document A Title: "${titleA}"\nDocument B Title: "${titleB}"\n\n` : '';

    return `${titleText}Compare the following two documents:
  
Document A (Target document that needs improvement):
"${contentA}"

Document B (Source document that may contain additional information):
"${contentB}"

Identify key points, concepts, or information present in Document B but missing from Document A.
For each missing element, generate:
1. A brief title describing the missing information
2. The type of suggestion (choose from: missing_content, clarification, structure, key_point)
3. Content formatted as a Quill Delta JSON object with basic formatting

Format your response as JSON with the following structure:
[
  {
    "title": "Suggestion Title",
    "type": "suggestion_type",
    "content": {
      "ops": [
        {"insert": "Heading", "attributes": {"header": 3}},
        {"insert": "\\n"},
        {"insert": "The missing content with appropriate formatting.\\n"}
      ]
    }
  }
]

If you don't find any significant missing information, return an empty array: []`;
}

/**
 * Extract plain text from a Quill Delta object
 */
function extractTextFromQuillDelta(delta) {
    if (!delta || !delta.ops) return '';

    return delta.ops.reduce((text, op) => {
        if (typeof op.insert === 'string') {
            return text + op.insert;
        }
        return text;
    }, '');
}

/**
 * Parse the OpenAI response into suggestion objects
 */
function parseSuggestionsFromResponse(responseContent, noteId, sourceUserId) {
    try {
        console.log('Parsing response for suggestions');
        console.log('Note ID for suggestions:', noteId);

        // Extract JSON from the response
        const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.log('No JSON array found in response');
            return [];
        }

        const suggestionsData = JSON.parse(jsonMatch[0]);
        console.log(`Found ${suggestionsData.length} suggestions in response`);

        // Map the parsed data to suggestion objects
        return suggestionsData.map(suggestion => ({
            title: suggestion.title,
            type: suggestion.type || 'missing_content', // Default type if missing
            content: suggestion.content,
            noteId: noteId.toString(), // Convert to string to ensure compatibility
            source: `User ${sourceUserId}`,
            status: 'pending'
        }));

    } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        return [];
    }
}
