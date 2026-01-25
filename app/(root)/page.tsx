import InterviewCard from '@/components/InterviewCard'
import { Button } from '@/components/ui/button'
import { dummyInterviews } from '@/constants'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { getInterviewByUserId, getLatestInterviews } from '@/lib/actions/general.action'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Page = async () => {

  const user = await getCurrentUser()

  // const userInterviews = await getInterviewByUserId(user?.id!)
  // const latestInterviews = await getLatestInterviews({ userId: user?.id! })

  // Above method is a little slower, so we will use parallel data fetching to optimize the performance
  const [userInterviews, latestInterviews] = await Promise.all([
    await getInterviewByUserId(user?.id!),
    await getLatestInterviews({ userId: user?.id! }) // We are passing this in the form of an object because in future we might need to pass more parameters (like 'limit' if you see in the backend).
  ])

  const hasPastInterviews = userInterviews?.length > 0
  const hasUpcomingInterviews = latestInterviews?.length > 0

  return (
    <div>
      <section className='card-cta'>
        <div className='flex flex-col gap-6 max-w-lg'>
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className='text-lg'>
            Practice on real interview questions & get instant feedback
          </p>
          <Button asChild className='btn-primary max-sm:w-full'>
            <Link href='/interview'>
              Start an Interview
            </Link>
          </Button>
        </div>
        <Image src='/robot.png' alt='robo-dude' width={400} height={400} className='max-sm:hidden' />
      </section>
      <section className='flex flex-col gap-6 mt-8'>
        <h2>Your Interviews</h2>
        <div className='interviews-section'>

          {
            hasPastInterviews ? (
              userInterviews?.map((interview) => (
                <InterviewCard {...interview} key={interview.id} />
              ))
            ) : (
              <p>You haven't taken any interviews yet</p>
            )
          }

          {/* {
          dummyInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id} />
          ))} */}
        </div>
      </section>
      <section className='flex flex-col gap-6 mt-8'>
        <h2>Take an Interview</h2>
        <div className='interviews-section'>
          {
            hasUpcomingInterviews ? (
              latestInterviews?.map((interview) => (
                <InterviewCard {...interview} key={interview.id} />
              ))
            ) : (
              <p>There are no new interviews available</p>
            )
          }
          {/* {dummyInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id} />
          ))} */}
          {/* <p>There are no interviews available</p> */}
        </div>
      </section>
    </div>
  )
}

export default Page