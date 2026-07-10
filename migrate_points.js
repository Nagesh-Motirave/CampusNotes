const { MongoClient } = require('mongodb');

// The user must provide the production MONGODB_URI
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("ERROR: MONGODB_URI environment variable is missing.");
    console.error("Please set it to your Railway production database URI and run again.");
    process.exit(1);
}

async function runMigration() {
    console.log("Connecting to MongoDB Atlas...");
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log("Connected successfully!");

        const notesDb = client.db('campus_notes_hub_notes');
        const usersDb = client.db('campus_notes_hub_users');

        const notesCollection = notesDb.collection('notes');
        const usersCollection = usersDb.collection('users');

        console.log("Fetching all verified notes...");
        const verifiedNotes = await notesCollection.find({ verified: true }).toArray();
        console.log(`Found ${verifiedNotes.length} verified notes.`);

        // Aggregate points per user
        // Total Points = (Number of Approved Notes Uploaded by User) * 5
        const userPointsMap = {};
        for (const note of verifiedNotes) {
            const userId = note.uploadedBy;
            if (!userId) continue;
            
            if (!userPointsMap[userId]) {
                userPointsMap[userId] = 0;
            }
            userPointsMap[userId] += 5;
        }

        console.log("Points map computed. Example entries:", Object.entries(userPointsMap).slice(0, 3));

        // Fetch all users to reset those who don't have verified notes
        console.log("Fetching all users to update their points...");
        const users = await usersCollection.find({}).toArray();
        console.log(`Found ${users.length} users.`);

        let updatedCount = 0;
        for (const user of users) {
            const userIdString = user._id.toString();
            // Total Points = (Number of Approved Notes Uploaded by User) * 5
            const correctPoints = userPointsMap[userIdString] || 0;

            if (user.points !== correctPoints) {
                console.log(`Updating user ${user.email} (ID: ${userIdString}) from ${user.points || 0} points to ${correctPoints} points...`);
                await usersCollection.updateOne(
                    { _id: user._id },
                    { $set: { points: correctPoints } }
                );
                updatedCount++;
            }
        }

        console.log(`Migration completed successfully! Updated ${updatedCount} users.`);
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.close();
        console.log("Database connection closed.");
    }
}

runMigration();
