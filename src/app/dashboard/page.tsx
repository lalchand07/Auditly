import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link';
import { SignOutButton } from './SignOutButton';

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the first workspace the user is a member of
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (memberError || !memberData) {
    // If a user has no workspace, they might need to be prompted to create one.
    // For this MVP, we'll just show a message.
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Welcome!</h1>
          <p className="text-gray-600">You are not part of any workspace yet.</p>
          {/* TODO: Add a "Create Workspace" button here */}
        </div>
      </div>
    );
  }

  const workspaceId = memberData.workspace_id;

  // Fetch scans for the current workspace
  const { data: scans, error: scansError } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (scansError) {
    console.error('Error fetching scans:', scansError);
    // Handle error display
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 lg:px-8 flex justify-between items-center py-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <SignOutButton />
        </nav>
      </header>
      <main className="container mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Recent Scans</h2>
              <p className="text-gray-500">A list of the most recent scans in your workspace.</p>
            </div>
            <Link href="/scan" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              New Scan
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {scans && scans.length > 0 ? (
              scans.map((scan) => (
                <li key={scan.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-indigo-600">{scan.url}</p>
                    <p className="text-sm text-gray-500">
                      Status: <span className={`font-medium ${
                        scan.status === 'done' ? 'text-green-500' :
                        scan.status === 'failed' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>{scan.status}</span>
                    </p>
                  </div>
                  <div>
                    {scan.status === 'done' && scan.pdf_url && (
                      <Link href={scan.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                        View Report
                      </Link>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">
                No scans found. Start your first scan!
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
