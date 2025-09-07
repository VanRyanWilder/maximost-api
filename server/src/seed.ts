import { supabase } from './lib/supabaseClient';
import { faker } from '@faker-js/faker';

// --- SEED DATA DEFINITION ---

const seedUsers = [
  {
    email: 'user1@test.com',
    password: 'password123',
    profile: {
      username: 'testuser1',
      full_name: 'Test User One',
    },
  },
  {
    email: 'user2@test.com',
    password: 'password123',
    profile: {
      username: 'testuser2',
      full_name: 'Test User Two',
    },
  },
];

// --- HELPER FUNCTIONS ---

/**
 * Cleans the database by deleting existing data in reverse order of dependencies.
 */
async function cleanDatabase() {
  console.log('Cleaning database...');

  // Get all user IDs from the auth schema to delete them
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users for cleanup:', usersError);
    return;
  }

  const testUserIds = users.users
    .filter(u => u.email?.endsWith('@test.com'))
    .map(u => u.id);

  if (testUserIds.length === 0) {
    console.log('No test users to clean up.');
    return;
  }

  // The rest of the data should be cleaned up by cascade delete when the user is deleted.
  // We just need to delete the auth users.
  console.log(`Found ${testUserIds.length} test users to delete...`);
  for (const userId of testUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
        console.error(`Failed to delete user ${userId}:`, error.message);
    } else {
        console.log(`Successfully deleted user ${userId}`);
    }
  }

  console.log('Database cleaning complete.');
}

/**
 * Seeds the database with users, profiles, habits, and completions.
 */
async function seedDatabase() {
  console.log('Seeding database...');

  for (const userData of seedUsers) {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for simplicity
    });

    if (authError) {
      console.error(`Error creating auth user ${userData.email}:`, authError.message);
      continue; // Skip to the next user if creation fails
    }
    const userId = authData.user.id;
    console.log(`Created auth user: ${userData.email} (ID: ${userId})`);

    // 2. Create Profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      ...userData.profile,
    });
    if (profileError) {
      console.error(`Error creating profile for ${userData.email}:`, profileError.message);
    } else {
        console.log(`Created profile for ${userData.email}`);
    }

    // 3. Create Habits for the user
    for (let i = 0; i < 3; i++) {
        const habit = {
            user_id: userId,
            name: faker.lorem.words({ min: 2, max: 4 }),
            description: faker.lorem.sentence(),
            start_date: faker.date.past({ years: 1 }),
            frequency_type: faker.helpers.arrayElement(['daily', 'weekly']),
            color: faker.color.rgb(),
            icon: '🔥',
        };
        const { data: habitData, error: habitError } = await supabase.from('habits').insert(habit).select().single();
        if (habitError) {
            console.error(`Error creating habit for ${userData.email}:`, habitError.message);
            continue;
        } else {
            console.log(`Created habit: "${habit.name}"`);
        }

        // 4. Create Completions for the habit
        for (let j = 0; j < 10; j++) {
            const completion = {
                habit_id: habitData.id,
                user_id: userId,
                completed_at: faker.date.recent({ days: 30 }),
                quantity: faker.helpers.arrayElement([1, 5, 10, null]),
            };
            const { error: completionError } = await supabase.from('completions').insert(completion);
            if (completionError) {
                console.error(`Error creating completion for habit "${habit.name}":`, completionError.message);
            }
        }
        console.log(`Created 10 completions for habit "${habit.name}"`);
    }
  }

  console.log('Database seeding complete.');
}

/**
 * Main function to run the seeding process.
 */
async function main() {
  await cleanDatabase();
  await seedDatabase();
}

main().catch((err) => {
  console.error('An unexpected error occurred during the seeding process:', err);
  process.exit(1);
});
