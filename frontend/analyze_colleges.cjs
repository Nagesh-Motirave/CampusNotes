const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('campus_notes_hub_users');
    
    // Fetch all users with a college string
    const users = await db.collection('users').find({ college: { $exists: true, $ne: null, $ne: "" } }).toArray();
    
    console.log(`Found ${users.length} users with college string.`);
    
    // Find distinct colleges
    const distinctColleges = [...new Set(users.map(u => u.college))];
    console.log(`Found ${distinctColleges.length} distinct college names.`);
    
    // Output all distinct strings for inspection
    console.log("Distinct College Strings:");
    distinctColleges.sort().forEach(c => console.log(` - ${c}`));
    
    // Fetch all College Master records
    const colleges = await db.collection('colleges').find().toArray();
    console.log(`\nFound ${colleges.length} College Master records.`);
    
    colleges.forEach(c => {
      console.log(` [Master] ID: ${c._id}, Official: ${c.officialName}, Short: ${c.shortName}, Aliases: ${c.aliases?.join(', ') || ''}`);
    });
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();
