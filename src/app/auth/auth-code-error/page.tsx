export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
        <p className="text-gray-600">
          Something went wrong during the authentication process. Please try
          signing in again.
        </p>
      </div>
    </div>
  );
}
