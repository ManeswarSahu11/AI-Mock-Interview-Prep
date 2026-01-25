import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { getRandomInterviewCover } from '@/lib/utils'
import { db } from '@/firebase/admin'

/************************* IMAGE PRESENT FOR VAPI WORKFLOW*************************/

export async function GET() {
  return Response.json({ success: true, data: 'Thank you' }, { status: 200 })
}

export async function POST(request: Request) {

  const { type, role, level, techstack, amount, userid } = await request.json()

  try {

    const { text: questions } = await generateText({ // renaming 'text' to 'questions'
      model: google('gemini-2.0-flash-001'),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The number of questions required is: ${amount}.
        Ensure the questions include recent ones asked in MNCs and startups. . Cover a mix of fundamental and advanced topics relevant to the role and tech stack. 
        If the role involves system design or real-world problem-solving, include scenario-based questions.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5", "Question 6"]
        Thank you!`,
    })

    const interview = {
      role, type, level, 
      techstack: techstack.split(','), // just in case the user inputs multiple techstacks
      questions: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString()
    }

    await db.collection("interviews").add(interview)

    return Response.json({ success: true }, { status: 200 })

  } catch (error) {
    console.log(error);
    return Response.json({ success: false, error }, { status: 500 })
  }

}