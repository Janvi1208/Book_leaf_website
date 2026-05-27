const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./database');

async function seed() {
  const db = getDb();
  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec(`
    DELETE FROM ticket_messages;
    DELETE FROM tickets;
    DELETE FROM books;
    DELETE FROM users;
  `);

  // Create users
  const adminId = uuidv4();
  const author1Id = uuidv4();
  const author2Id = uuidv4();

  const adminHash = await bcrypt.hash('admin123', 10);
  const authorHash = await bcrypt.hash('author123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run(adminId, 'admin@bookleaf.com', adminHash, 'Priya Sharma', 'admin');
  insertUser.run(author1Id, 'arjun@example.com', authorHash, 'Arjun Mehta', 'author');
  insertUser.run(author2Id, 'kavya@example.com', authorHash, 'Kavya Reddy', 'author');

  // Create books
  const book1Id = uuidv4();
  const book2Id = uuidv4();
  const book3Id = uuidv4();
  const book4Id = uuidv4();

  const insertBook = db.prepare(`
    INSERT INTO books (id, author_id, title, isbn, genre, publication_date, status, mrp, copies_sold, royalty_rate, royalty_paid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBook.run(book1Id, author1Id, 'The Midnight Algorithm', '978-81-234-5678-1', 'Thriller', '2023-03-15', 'Published', 499, 1240, 0.10, 42800);
  insertBook.run(book2Id, author1Id, 'Echoes of the Ganges', '978-81-234-5678-2', 'Literary Fiction', '2022-11-01', 'Published', 399, 3820, 0.10, 117480);
  insertBook.run(book3Id, author2Id, 'Startup Dreams', '978-81-234-5678-3', 'Non-Fiction', '2024-01-20', 'Published', 349, 580, 0.12, 17150);
  insertBook.run(book4Id, author2Id, 'The Quiet Revolution', '978-81-234-5678-4', 'Political Fiction', '2023-07-08', 'Under Review', 449, 0, 0.10, 0);

  // Create tickets
  const ticket1Id = uuidv4();
  const ticket2Id = uuidv4();
  const ticket3Id = uuidv4();
  const ticket4Id = uuidv4();
  const ticket5Id = uuidv4();

  const insertTicket = db.prepare(`
    INSERT INTO tickets (id, author_id, book_id, subject, description, status, category, priority, ai_category, ai_priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTicket.run(ticket1Id, author1Id, book1Id,
    'Royalty payment not received for Q3 2024',
    'I have not received my royalty payment for Q3 2024 (July-September). The payment was due on October 31st as per the agreement. It is now 6 weeks overdue. The amount should be approximately ₹18,000 based on my sales data. Please investigate urgently.',
    'Open', 'Royalty & Payments', 'Critical', 'Royalty & Payments', 'Critical');

  insertTicket.run(ticket2Id, author1Id, book2Id,
    'Wrong ISBN shown on Amazon listing',
    'The ISBN displayed on the Amazon product page for "Echoes of the Ganges" is incorrect. It shows 978-81-234-0000-0 instead of the correct ISBN 978-81-234-5678-2. This is causing confusion with customers and may be affecting discoverability.',
    'In Progress', 'ISBN & Metadata Issues', 'High', 'ISBN & Metadata Issues', 'High');

  insertTicket.run(ticket3Id, author1Id, null,
    'Can I update my author biography on the website?',
    'I would like to update my author biography on the BookLeaf website and author page. My current bio is outdated. I have a new version ready to share. Please let me know the process for updating this.',
    'Resolved', 'General Inquiry', 'Low', 'General Inquiry', 'Low');

  insertTicket.run(ticket4Id, author2Id, book3Id,
    'Book not available on Flipkart',
    '"Startup Dreams" is not showing up on Flipkart search even though it was supposed to be distributed there. Customers have been reaching out to me saying they cannot find it. It has been 3 months since publication.',
    'Open', 'Distribution & Availability', 'High', 'Distribution & Availability', 'High');

  insertTicket.run(ticket5Id, author2Id, book4Id,
    'Status update on The Quiet Revolution review',
    'My book "The Quiet Revolution" has been Under Review for over 5 months now. I submitted all required documents in August. Can you please provide a status update and estimated timeline for completion?',
    'Open', 'Book Status & Production Updates', 'Medium', 'Book Status & Production Updates', 'Medium');

  // Create messages
  const insertMessage = db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message, is_internal_note, ai_drafted)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Ticket 2 has a back-and-forth
  insertMessage.run(uuidv4(), ticket2Id, author1Id, 'author',
    'The wrong ISBN shown on Amazon listing is causing issues. Please fix this urgently.', 0, 0);
  insertMessage.run(uuidv4(), ticket2Id, adminId, 'admin',
    'Thank you for reporting this. We have flagged the issue with our metadata team and are in contact with Amazon. We expect this to be resolved within 3-5 business days. We will keep you updated.', 0, 1);

  // Ticket 3 is resolved
  insertMessage.run(uuidv4(), ticket3Id, adminId, 'admin',
    'Hi Arjun, to update your author biography, please email your new bio (max 300 words) along with an updated author photo to authors@bookleaf.com. We will update it within 2-3 business days.', 0, 0);
  insertMessage.run(uuidv4(), ticket3Id, author1Id, 'author',
    'Thank you! I have sent the updated bio to the email address provided.', 0, 0);

  console.log('✅ Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:   admin@bookleaf.com / admin123');
  console.log('  Author1: arjun@example.com  / author123');
  console.log('  Author2: kavya@example.com  / author123');
}

seed().catch(console.error);
