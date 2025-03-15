const mongoose = require('mongoose');
const Note = require('../models/noteModel');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB for test simulation'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Seed test notes for different users on the same topic
async function seedTestNotes() {
    try {
        const testNotes = [
            {
                id: 'note1',
                title: 'Bees and Pollination - User 1',
                content: JSON.stringify({
                    ops: [
                        { insert: 'Bees and Pollination\n', attributes: { header: 1 } },
                        { insert: 'Honey bees are important pollinators that help many plants reproduce. They collect nectar and pollen from flowers.\n\n' },
                        { insert: 'Types of Bees\n', attributes: { header: 2 } },
                        { insert: 'There are many species of bees including honey bees, bumble bees, and solitary bees.\n' }
                    ]
                }),
                userId: 'user1',
                topic: 'bees'
            },
            {
                id: 'note2',
                title: 'Bee Pollination Notes - User 2',
                content: JSON.stringify({
                    ops: [
                        { insert: 'Bee Pollination\n', attributes: { header: 1 } },
                        { insert: 'Bees are crucial pollinators in ecosystems worldwide. They help plants reproduce by transferring pollen between flowers.\n\n' },
                        { insert: 'Colony Collapse Disorder\n', attributes: { header: 2 } },
                        { insert: 'A phenomenon where worker bees abandon the hive, leaving the queen and immature bees behind. This has resulted in significant bee population decline since 2006.\n' }
                    ]
                }),
                userId: 'user2',
                topic: 'bees'
            },
            {
                id: 'note3',
                title: 'Importance of Bees - User 3',
                content: JSON.stringify({
                    ops: [
                        { insert: 'The Importance of Bees\n', attributes: { header: 1 } },
                        { insert: 'Bees play a vital role in our ecosystem and agriculture.\n\n' },
                        { insert: 'Pollination Impact\n', attributes: { header: 2 } },
                        { insert: 'Bees pollinate approximately 70% of the world\'s cultivated crops, accounting for about 90% of global nutrition.\n\n' },
                        { insert: 'Bee Products\n', attributes: { header: 2 } },
                        { insert: 'In addition to pollination, bees produce honey, beeswax, propolis, and royal jelly.\n' }
                    ]
                }),
                userId: 'user3',
                topic: 'bees'
            }
        ];

        // Clear existing test notes with these IDs
        await Note.deleteMany({ id: { $in: testNotes.map(note => note.id) } });

        // Insert new test notes
        const createdNotes = await Note.insertMany(testNotes);
        console.log('Test notes created:', createdNotes);

        console.log('\nTest Instructions:');
        console.log('1. Open three different browser windows/profiles');
        console.log('2. In each browser, navigate to http://localhost:3000');
        console.log('3. In the first browser, use userId "user1"');
        console.log('4. In the second browser, use userId "user2"');
        console.log('5. In the third browser, use userId "user3"');
        console.log('6. In each browser, trigger the comparison to generate suggestions');
        console.log('7. Observe how suggestions from other users\' notes appear in each user\'s suggestion panel\n');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding test notes:', error);
        mongoose.connection.close();
    }
}

seedTestNotes();
