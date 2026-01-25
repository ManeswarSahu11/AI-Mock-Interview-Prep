'use server'

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin"
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export async function getInterviewByUserId(userId: string): Promise<Interview[] | null> {

  if (!userId) return null;

  const interviews = await db
    .collection('interviews')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get()

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Interview[]
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params

  const interviews = await db
    .collection('interviews')
    .orderBy('createdAt', 'desc')
    .where('finalized', '==', true)
    .where('userId', '!=', userId)
    .limit(limit)
    .get()

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Interview[]
}

export async function getInterviewById(id: string): Promise<Interview | null> {

  const interview = await db
    .collection('interviews')
    .doc(id)
    .get()

  return interview.data() as Interview | null
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript } = params

  try {
    const formattedTranscript = transcript.map((sentence: { role: string; content: string }) => (
      `- ${sentence.role}: ${sentence.content}`
    )).join('')

    const { object: {totalScore, categoryScores, strengths, areasForImprovement, finalAssessment} } = await generateObject({
      model: google('gemini-2.0-flash-001', {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to critically evaluate the candidate's performance across structured categories. 
        Be **thorough, objective, and precise** in your analysis. Do not be overly lenient—highlight both strengths and areas for improvement. 
        If the candidate makes mistakes or lacks clarity, explicitly point them out with constructive feedback.  
        
        **Interview Transcript:**  
        ${formattedTranscript} 

        **Evaluation Criteria (Score from 0 to 100)**  
        Score the candidate in the following areas based **only on the provided categories**. Do not introduce additional criteria.  
        - **Communication Skills**: Clarity, articulation, structured responses.  
        - **Technical Knowledge**: Depth of understanding and accuracy of key concepts relevant to the role.  
        - **Problem-Solving Ability**: Logical thinking, ability to analyze complex problems, and effectiveness of proposed solutions.  
        - **Cultural & Role Fit**: Alignment with company values, adaptability, and suitability for the job.  
        - **Confidence & Clarity**: Confidence in responses, ability to engage effectively, and overall clarity of thought.  

         Provide specific feedback on each category, citing relevant portions of the transcript where applicable. Conclude with a final assessment summarizing the candidate's overall performance, key strengths, and areas for improvement."
         `,
      system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be objective, detailed, and critical in your assessment. Highlight both strengths and areas for improvement."  
    })
    
    const feedback = await db.collection('feedback').add({
      interviewId,
      userId,
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date().toISOString()
    })

    return {
      success: true,
      feedbackId: feedback.id
    }
  } catch (error) {
    console.log("Error creating feedback", error);
    return { success: false }
  }
} 

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
  const { interviewId, userId } = params

  const feedback = await db
    .collection('feedback')
    .where('interviewId', '==', interviewId)
    .where('userId', '==', userId)
    .limit(1)
    .get()

  if(feedback.empty) return null;

  const feedbackDoc = feedback.docs[0];

  return {
    id: feedbackDoc.id,
    ...feedbackDoc.data()
  } as Feedback
}