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
    let targetDelta = null;
    try {
        // Check if the content is JSON and needs parsing
        if (typeof targetContent === 'string' &&
            (targetContent.startsWith('{') || targetContent.startsWith('['))) {
            console.log('Parsing target note content as JSON');
            targetDelta = JSON.parse(targetContent);
            targetContent = extractTextFromQuillDelta(targetDelta);
        }
    } catch (error) {
        console.error('Error parsing target note content:', error);
        // Continue with the original content
    }

    // Extract style patterns from target note
    const styleAnalysis = analyzeNoteStyle(targetDelta, targetContent);
    console.log('Style analysis:', styleAnalysis);

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
                sourceNote.title,
                styleAnalysis
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
                          Each suggestion should include a title and content formatted as a valid Quill Delta object.
                          Maintain the writing style, tone, and formatting patterns of Document A (not Document B).
                          Ensure your Quill Delta objects follow proper structure with valid ops arrays.`
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
function createComparisonPrompt(documentA, documentB, titleA = '', titleB = '', styleAnalysis = {}) {
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

    // Add style guidance based on analysis
    let styleGuidance = '';
    if (styleAnalysis) {
        styleGuidance = `
Style guidance for Document A:
- Sentence length: ${styleAnalysis.sentenceLength || 'varied'}
- Formality level: ${styleAnalysis.formalityLevel || 'moderate'} 
- Use of bullet points: ${styleAnalysis.usesBulletPoints ? 'yes' : 'minimal'}
- Headers pattern: ${styleAnalysis.headersPattern || 'standard'}
- Formatting preferences: ${styleAnalysis.formattingPreferences || 'minimal'}

It's critical that your suggestions match Document A's existing style - NOT Document B's style.
`;
    }

    return `${titleText}Compare the following two documents:
  
Document A (Target document that needs improvement):
"${contentA}"

Document B (Source document that may contain additional information):
"${contentB}"

${styleGuidance}

Identify key points, concepts, or information present in Document B but missing from Document A.
For each missing element, generate:
1. A brief title describing the missing information
2. The type of suggestion (choose from: missing_content, clarification, structure, key_point)
3. Content formatted as a proper Quill Delta JSON object with basic formatting

The Quill Delta object should:
- Follow Document A's writing style, tone, and terminology
- Use appropriate header levels if headers are used in Document A
- Match Document A's use of bullet points, emphasis, and other formatting
- Be properly formatted with valid "ops" array structure

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
 * Analyze a note's writing style to help guide AI suggestions
 */
function analyzeNoteStyle(delta, plainText) {
    const analysis = {
        sentenceLength: 'medium',
        formalityLevel: 'moderate',
        usesBulletPoints: false,
        headersPattern: 'minimal',
        formattingPreferences: ''
    };

    // If we don't have a valid delta or text, return default analysis
    if (!delta || !delta.ops || !plainText) {
        return analysis;
    }

    try {
        // Analyze sentence length
        const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

        if (avgSentenceLength < 60) analysis.sentenceLength = 'short';
        else if (avgSentenceLength > 120) analysis.sentenceLength = 'long';

        // Check for formal language indicators
        const formalIndicators = ["however", "therefore", "consequently", "thus", "hence"];
        const informalIndicators = ["anyway", "plus", "so", "also", "like", "actually"];

        let formalCount = 0;
        let informalCount = 0;
        formalIndicators.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = plainText.match(regex);
            if (matches) formalCount += matches.length;
        });

        informalIndicators.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = plainText.match(regex);
            if (matches) informalCount += matches.length;
        });

        if (formalCount > informalCount * 2) analysis.formalityLevel = 'formal';
        else if (informalCount > formalCount * 2) analysis.formalityLevel = 'casual';

        // Check for bullet points and headers
        let bulletPointCount = 0;
        let headerCount = 0;
        let formattingStyles = new Set();

        delta.ops.forEach(op => {
            // Check for bullet points
            if (op.attributes && op.attributes.list) {
                bulletPointCount++;
                analysis.usesBulletPoints = true;
            }

            // Check for headers
            if (op.attributes && op.attributes.header) {
                headerCount++;
                formattingStyles.add('header-' + op.attributes.header);
            }

            // Track other formatting
            if (op.attributes) {
                Object.keys(op.attributes).forEach(attr => {
                    if (['bold', 'italic', 'underline', 'code', 'link'].includes(attr)) {
                        formattingStyles.add(attr);
                    }
                });
            }
        });

        if (headerCount > 3) analysis.headersPattern = 'frequent';
        else if (headerCount > 0) analysis.headersPattern = 'standard';

        analysis.formattingPreferences = Array.from(formattingStyles).join(', ') || 'minimal';

    } catch (error) {
        console.error('Error analyzing note style:', error);
    }

    return analysis;
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

        // Validate each suggestion's content format
        const validatedSuggestions = suggestionsData.map(suggestion => {
            // Ensure content has proper Quill Delta structure
            const validContent = validateQuillDelta(suggestion.content);

            return {
                title: suggestion.title,
                type: suggestion.type || 'missing_content', // Default type if missing
                content: validContent,
                noteId: noteId.toString(), // Convert to string to ensure compatibility
                source: `User ${sourceUserId}`,
                status: 'pending'
            };
        }).filter(s => s.content !== null);

        console.log(`Validated ${validatedSuggestions.length} suggestions with proper Delta format`);
        return validatedSuggestions;

    } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        return [];
    }
}

/**
 * Validate and fix Quill Delta format if necessary
 */
function validateQuillDelta(content) {
    if (!content || typeof content !== 'object') {
        console.log('Invalid content format, not an object');
        return null;
    }

    // Ensure content has ops array
    if (!content.ops || !Array.isArray(content.ops)) {
        console.log('Invalid Delta: missing ops array');
        return null;
    }

    // Validate each operation in the delta
    const validOps = content.ops.filter(op => {
        return op && typeof op === 'object' &&
            (typeof op.insert === 'string' || op.insert === null);
    });

    // If ops were filtered, log a warning
    if (validOps.length !== content.ops.length) {
        console.log(`Fixed Delta by removing ${content.ops.length - validOps.length} invalid ops`);
    }

    // Ensure proper line breaks at the end
    const lastOp = validOps[validOps.length - 1];
    if (lastOp && typeof lastOp.insert === 'string' && !lastOp.insert.endsWith('\n')) {
        validOps.push({ insert: '\n' });
    }

    return {
        ops: validOps
    };
}
