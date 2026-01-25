'use client'
import { signOut } from '@/lib/actions/auth.action'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const Navbar = () => {
  const handleLogout = async () => {
    await signOut()
    redirect('/sign-in')
  }

  return (
    <nav className='flex justify-between items-center'>
      <Link href='/' className='flex items-center'>
        <Image src='/logo.svg' alt='Logo' width={120} height={120} />
        <h2 className='text-primary-100'>InterviewPrep</h2>
      </Link>

      <button
        onClick={handleLogout}
        className='btn-secondary px-4 rounded-lg hover:opacity-90'
      >
        Logout
      </button>
    </nav>
  )
}

export default Navbar