import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url, workspace_id } = await request.json()

  if (!url || !workspace_id) {
    return NextResponse.json(
      { error: 'Missing required fields: url and workspace_id' },
      { status: 400 }
    )
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  // 1. Check if the user is a member of the workspace.
  // RLS policies should prevent this, but an explicit check provides a better error message.
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace_id)
    .single()

  if (memberError || !member) {
    return NextResponse.json(
      { error: 'You do not have permission to create scans in this workspace.' },
      { status: 403 }
    )
  }

  // 2. Check if the workspace has reached its scan limit based on the owner's plan.
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspace_id)
    .single()

  if (workspaceError || !workspaceData) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })
  }

  const { data: ownerProfile, error: profileError } = await supabase
    .from('users')
    .select('plan')
    .eq('id', workspaceData.owner_id)
    .single()

  if (profileError || !ownerProfile) {
    return NextResponse.json(
      { error: "Could not determine the workspace's subscription plan." },
      { status: 500 }
    )
  }

  const planLimits: Record<string, number> = {
    starter: 10,
    pro: 50,
    agency: 200,
  }
  const plan = ownerProfile.plan ?? 'starter';
  const limit = planLimits[plan];

  if (typeof limit === 'undefined') {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 500 });
  }

  const { count, error: countError } = await supabase
    .from('scan_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace_id)

  if (countError) {
    console.error('Error counting scans:', countError)
    return NextResponse.json(
      { error: 'Failed to check usage limits' },
      { status: 500 }
    )
  }

  if (count >= limit) {
    return NextResponse.json(
      { error: `Scan limit of ${limit} reached for the '${plan}' plan.` },
      { status: 402 } // Payment Required
    )
  }

  // If all checks pass, create the scan job
  const { data, error } = await supabase
    .from('scan_jobs')
    .insert([
      {
        url,
        workspace_id,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating scan job:', error)
    return NextResponse.json(
      { error: 'Failed to create scan job. Please check your permissions.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
