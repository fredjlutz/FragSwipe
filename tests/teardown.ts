import { createAdminClient } from '../lib/supabase/admin';

async function main() {
    console.log('🛑 Starting database teardown script...');

    if (process.env.NODE_ENV !== 'test') {
        console.error('❌ Refusing to run teardown script because NODE_ENV is not set to "test".');
        process.exit(1);
    }

    const supabase = createAdminClient();

    console.log('🧹 Cleaning up test users and associated data...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Failed to list users:', listError);
        process.exit(1);
    }

    const testUsers = users.filter(u => u.email?.endsWith('@test.fragswipe.local'));

    if (testUsers.length === 0) {
        console.log('✅ No test users found to clean up.');
        process.exit(0);
    }

    let deleted = 0;
    for (const user of testUsers) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
            console.error(`Failed to delete user ${user.email}:`, error);
        } else {
            console.log(`✅ Deleted ${user.email}`);
            deleted++;
        }
    }

    console.log(`🎉 Teardown complete. ${deleted} users deleted.`);
    process.exit(0);
}

main().catch(e => {
    console.error('Unexpected error during teardown:', e);
    process.exit(1);
});
