'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SignupSuccessPage() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-green-600">Success!</h1>
                <p className="text-gray-700">
                    {message || 'Your account has been created. Please check your email to confirm your account.'}
                </p>
                <Link href="/login" className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                    Proceed to Login
                </Link>
            </div>
        </div>
    )
}
