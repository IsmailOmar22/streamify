import Header from '@/components/Header'
import React from 'react'

export default function ApiKeysPage() {
  return (
    <>
    <Header />
      <main className="pt-24 px-4 min-h-screen sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">API Keys</h1>
          <p className="mt-1 text-sm text-gray-400">Manage your secret keys for accessing the Streamify API.</p>
        </div>
      </main>
    </>
  )
}

