const openai = require('../config/openaiConfig');

const formatLog = (type, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logObj = {
        timestamp,
        type,
        message,
        ...(data && { data })
    };
    console.log(JSON.stringify(logObj));
};

/**
 * Generate suggestions based on comparing notes
 */
exports.generateSuggestions = async (targetNote, otherNotes) => {
    formatLog('info', 'Starting suggestion generation', {
        targetNoteId: targetNote._id,
        targetTitle: targetNote.title,
        compareCount: otherNotes.length
    });

    if (!targetNote.content) {
        formatLog('warn', 'Target note has no content', { noteId: targetNote._id });
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
            // No longer extract text - work with delta directly
        }
    } catch (error) {
        console.error('Error parsing target note content:', error);
        // Continue with the original content
    }

    // Extract style patterns from target note - but keep working with delta
    const styleAnalysis = analyzeNoteStyle(targetDelta);
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

            // Create a prompt for OpenAI to compare documents - passing deltas
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
                    model: "gpt-4o",
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
                    max_tokens: 4096 // allows full JSON response
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

                formatLog('debug', 'OpenAI API response received', {
                    responseLength: messageContent?.length,
                    firstChars: messageContent?.substring(0, 100)
                });

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
                formatLog('error', 'OpenAI API error', {
                    error: apiError.message,
                    code: apiError.code,
                    stack: apiError.stack
                });
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
 * Create a prompt for the OpenAI API to compare two documents using Delta format
 */
function createComparisonPrompt(documentA, documentB, titleA = '', titleB = '', styleAnalysis = {}) {
    formatLog('debug', 'Creating comparison prompt', {
        titleA,
        titleB,
        docALength: documentA?.length,
        docBLength: documentB?.length
    });

    // Parse JSON content but don't extract text
    let deltaA = documentA;
    let deltaB = documentB;

    try {
        if (typeof documentA === 'string' &&
            (documentA.startsWith('{') || documentA.startsWith('['))) {
            deltaA = JSON.parse(documentA);
        }

        if (typeof documentB === 'string' &&
            (documentB.startsWith('{') || documentB.startsWith('['))) {
            deltaB = JSON.parse(documentB);
        }
    } catch (error) {
        formatLog('error', 'Error parsing document content', { error: error.message });
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

It's critical that your suggestions match Document A's existing style and formatting patterns.
`;
    }

    return `${titleText}Compare the following two documents represented as Quill Delta JSON objects:
  
Document A (Target document that needs improvement):
${JSON.stringify(deltaA, null, 2)}

Document B (Source document that may contain additional information):
${JSON.stringify(deltaB, null, 2)}

${styleGuidance}

Identify key points, concepts, or information present in Document B but missing from Document A.
For each missing element:

1. ANALYZE WHERE in Document A the suggestion should be inserted for maximum relevance and coherence
2. Find a specific paragraph, section, or content in Document A that relates to your suggestion
3. Identify TEXT MARKERS - exact phrases (5-10 words) from Document A that indicate where your suggestion belongs

For each missing element, generate:
1. A brief title describing the missing information
2. The type of suggestion (choose from: missing_content, clarification, structure, key_point)
3. Content formatted as a proper Quill Delta JSON object with basic formatting
4. Insertion point recommendation with:
   - A relevant content marker (exact text snippet from Document A)
   - Position relative to marker (before/after)

The Quill Delta object should:
- Follow Document A's writing style, tone, and terminology
- Match Document A's formatting patterns with similar attributes
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
        {"insert": "The missing content with appropriate formatting.\\n"}
      ]
    },
    "insertionPoint": {
      "contentMarker": "exact text from Document A that precedes or follows insertion",
      "position": "after" // or "before"
    }
  }
]

If no good insertion point can be found, omit the insertionPoint property.
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
 * Works directly with Delta objects
 */
function analyzeNoteStyle(delta) {
    const analysis = {
        sentenceLength: 'medium',
        formalityLevel: 'moderate',
        usesBulletPoints: false,
        headersPattern: 'minimal',
        formattingPreferences: ''
    };

    // If we don't have a valid delta, return default analysis
    if (!delta || !delta.ops) {
        return analysis;
    }

    try {
        // Extract text content for sentence analysis
        const plainText = extractTextFromQuillDelta(delta);

        // Analyze sentence length
        const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.length > 0 ?
            sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length : 0;

        if (avgSentenceLength < 60) analysis.sentenceLength = 'short';
        else if (avgSentenceLength > 120) analysis.sentenceLength = 'long';

        // Check for formal language indicators in plain text
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

        // Directly analyze delta for formatting
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
        formatLog('error', 'Error analyzing note style', { error: error.message });
    }

    return analysis;
}

/**
 * Parse the OpenAI response into suggestion objects
 */
function parseSuggestionsFromResponse(responseContent, noteId, sourceUserId) {
    formatLog('debug', 'Parsing suggestions from response', {
        noteId,
        sourceUserId,
        responseLength: responseContent.length
    });

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

            // Include the insertionPoint if present
            const insertionPoint = suggestion.insertionPoint || null;

            return {
                title: suggestion.title,
                type: suggestion.type || 'missing_content', // Default type if missing
                content: validContent,
                insertionPoint: insertionPoint,
                noteId: noteId.toString(), // Convert to string to ensure compatibility
                source: `User ${sourceUserId}`,
                status: 'pending'
            };
        }).filter(s => s.content !== null);

        formatLog('info', 'Successfully parsed suggestions', {
            totalSuggestions: validatedSuggestions.length,
            validSuggestions: validatedSuggestions.map(s => ({
                title: s.title,
                type: s.type,
                hasInsertionPoint: !!s.insertionPoint
            }))
        });

        console.log(`Validated ${validatedSuggestions.length} suggestions with proper Delta format`);
        return validatedSuggestions;

    } catch (error) {
        formatLog('error', 'Failed to parse suggestions', {
            error: error.message,
            stack: error.stack
        });
        console.error('Error parsing OpenAI response:', error);
        return [];
    }
}

/**
 * Validate and fix Quill Delta format if necessary
 */
function validateQuillDelta(content) {
    if (!content || typeof content !== 'object') {
        formatLog('warn', 'Invalid Delta format', {
            received: typeof content
        });
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
        formatLog('warn', 'Fixed invalid Delta operations', {
            original: content.ops.length,
            valid: validOps.length
        });
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
