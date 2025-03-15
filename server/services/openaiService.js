const openai = require('../config/openaiConfig');

/**
 * Generate suggestions based on comparing notes
 * 
 * @param {Object} targetNote - The note to generate suggestions for
 * @param {Array} otherNotes - Other notes to compare with
 * @returns {Array} An array of suggestion objects
 */
exports.generateSuggestions = async (targetNote, otherNotes) => {
    console.log(`Generating suggestions for note ID: ${targetNote.id || targetNote._id}`);
    console.log(`Comparing with ${otherNotes.length} other notes`);

    const suggestions = [];

    // Process each note for comparison
    for (const sourceNote of otherNotes) {
        try {
            console.log(`Comparing with note from user: ${sourceNote.userId}`);

            // Create a prompt for OpenAI to compare documents
            const prompt = createComparisonPrompt(targetNote.content, sourceNote.content);

            // Call OpenAI API with the prompt
            console.log('Calling OpenAI API with prompt:', prompt);
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

            console.log('OpenAI response:', response);

            const messageContent = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
            if (!messageContent) {
                console.warn('No message content received from OpenAI');
                continue;
            }

            // Parse the response and create suggestion objects
            const noteId = targetNote.id || targetNote._id.toString();
            const suggestionsFromResponse = parseSuggestionsFromResponse(
                messageContent,
                noteId,
                sourceNote.userId
            );

            console.log(`Generated ${suggestionsFromResponse.length} suggestions from this comparison`);
            suggestions.push(...suggestionsFromResponse);

        } catch (error) {
            console.error('Error generating suggestions with OpenAI:', error);
            // Continue with other notes even if one comparison fails
        }
    }

    console.log(`Total suggestions generated: ${suggestions.length}`);
    return suggestions;
};

/**
 * Create a prompt for the OpenAI API to compare two documents
 */
function createComparisonPrompt(documentA, documentB) {
    // Parse JSON content if necessary
    let contentA = documentA;
    let contentB = documentB;

    try {
        if (typeof documentA === 'string' && documentA.startsWith('{')) {
            const parsedA = JSON.parse(documentA);
            contentA = extractTextFromQuillDelta(parsedA);
        }

        if (typeof documentB === 'string' && documentB.startsWith('{')) {
            const parsedB = JSON.parse(documentB);
            contentB = extractTextFromQuillDelta(parsedB);
        }
    } catch (error) {
        console.error('Error parsing document content:', error);
        // Continue with original content if parsing fails
    }

    return `Compare the following two documents:
  
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
