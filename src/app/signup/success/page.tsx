export default function SignupSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-gray-600">
          We've sent a confirmation link to your email address. Please click the
          link to complete your registration.
        </p>
      </div>
    </div>
  )
}
