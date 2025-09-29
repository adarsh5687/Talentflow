import { db, persistenceHelpers, type Job, type Assessment } from './database'
const TECHNOLOGIES = ['React', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'Vue.js', 'Angular', 'Svelte']
const EXPERIENCE_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Principal']
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations']
const LOCATIONS = ['Remote', 'New York', 'San Francisco', 'London', 'Berlin', 'Toronto', 'Austin', 'Seattle']
function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}
function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}
function generateJobs(): Job[] {
  const jobs: Job[] = []
  for (let i = 0; i < 25; i++) {
    const level = randomChoice(EXPERIENCE_LEVELS)
    const tech = randomChoice(TECHNOLOGIES)
    const department = randomChoice(DEPARTMENTS)
    const location = randomChoice(LOCATIONS)
    const title = `${level} ${tech} ${department === 'Engineering' ? 'Engineer' : department} - ${location}`
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const job: Job = {
      id: `job-${i + 1}`,
      title,
      company: randomChoice(['TechCorp Inc.', 'DataFlow Solutions', 'StartupX', 'CloudTech Systems', 'MobileFirst Ltd']),
      location,
      type: randomChoice(['Full-time', 'Part-time', 'Contract']),
      salary: `$${(Math.floor(Math.random() * 100) + 80)},000 - $${(Math.floor(Math.random() * 50) + 150)},000`,
      description: `We are looking for a talented ${level} ${tech} ${department === 'Engineering' ? 'Engineer' : department} to join our growing team. You will be working on cutting-edge projects using ${tech} and collaborating with a dynamic team.`,
      requirements: [
        `${Math.floor(Math.random() * 5) + 2}+ years of experience with ${tech}`,
        'Strong problem-solving skills',
        'Experience with agile development methodologies',
        'Excellent communication skills',
        'Bachelor\'s degree in Computer Science or related field'
      ],
      benefits: [
        'Competitive salary and equity',
        'Health, dental, and vision insurance',
        'Flexible work arrangements',
        'Professional development budget',
        'Unlimited PTO'
      ],
      postedDate: randomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
      applicationDeadline: randomDate(new Date(2024, 2, 1), new Date(2024, 5, 1)).toISOString().split('T')[0],
      status: i < 18 ? 'active' : 'archived', 
      slug,
      tags: randomChoices(TECHNOLOGIES, Math.floor(Math.random() * 4) + 2),
      order: i,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
      updatedAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
    }
    jobs.push(job)
  }
  return jobs
}
function generateAssessments(jobs: Job[]): Assessment[] {
  const assessments: Assessment[] = []
  for (let i = 0; i < 3; i++) {
    const job = jobs[i]
    const assessment: Assessment = {
      id: `assessment-${i + 1}`,
      jobId: job.id,
      title: `${job.title} - Technical Assessment`,
      description: `Technical assessment for ${job.title} position. This assessment evaluates your technical skills and problem-solving abilities.`,
      sections: [
        {
          id: `section-${i + 1}-1`,
          title: 'Technical Background',
          description: 'Tell us about your technical experience',
          order: 0,
          questions: [
            {
              id: `question-${i + 1}-1-1`,
              type: 'single-choice',
              title: 'Years of experience with React',
              required: true,
              options: [
                { id: 'opt-1', text: 'Less than 1 year', value: '<1' },
                { id: 'opt-2', text: '1-3 years', value: '1-3' },
                { id: 'opt-3', text: '3-5 years', value: '3-5' },
                { id: 'opt-4', text: 'More than 5 years', value: '5+' }
              ]
            },
            {
              id: `question-${i + 1}-1-2`,
              type: 'multi-choice',
              title: 'Which technologies have you worked with?',
              required: true,
              options: TECHNOLOGIES.map((tech, idx) => ({
                id: `tech-${idx}`,
                text: tech,
                value: tech.toLowerCase()
              }))
            },
            {
              id: `question-${i + 1}-1-3`,
              type: 'long-text',
              title: 'Describe a challenging project you worked on',
              description: 'Please provide details about the technologies used, your role, and the challenges you faced.',
              required: true,
              validation: {
                minLength: 100,
                maxLength: 1000
              }
            }
          ]
        },
        {
          id: `section-${i + 1}-2`,
          title: 'Problem Solving',
          description: 'Test your problem-solving skills',
          order: 1,
          questions: [
            {
              id: `question-${i + 1}-2-1`,
              type: 'long-text',
              title: 'Code Challenge: Implement a function to find duplicates in an array',
              description: 'Write a function that takes an array and returns all duplicate values. Include your reasoning.',
              required: true,
              validation: {
                minLength: 50
              }
            },
            {
              id: `question-${i + 1}-2-2`,
              type: 'numeric',
              title: 'How would you rate the complexity of this problem? (1-10)',
              required: true,
              validation: {
                min: 1,
                max: 10
              }
            }
          ]
        },
        {
          id: `section-${i + 1}-3`,
          title: 'Additional Information',
          description: 'Final questions',
          order: 2,
          questions: [
            {
              id: `question-${i + 1}-3-1`,
              type: 'single-choice',
              title: 'Are you open to remote work?',
              required: true,
              options: [
                { id: 'remote-yes', text: 'Yes', value: 'yes' },
                { id: 'remote-no', text: 'No', value: 'no' },
                { id: 'remote-hybrid', text: 'Hybrid only', value: 'hybrid' }
              ]
            },
            {
              id: `question-${i + 1}-3-2`,
              type: 'short-text',
              title: 'When can you start?',
              required: false,
              conditional: {
                dependsOn: `question-${i + 1}-3-1`,
                condition: 'equals',
                value: 'yes'
              },
              validation: {
                maxLength: 100
              }
            },
            {
              id: `question-${i + 1}-3-3`,
              type: 'file-upload',
              title: 'Upload your portfolio (optional)',
              required: false
            }
          ]
        }
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    assessments.push(assessment)
  }
  return assessments
}
export async function seedDatabase() {
  try {
    await db.delete()
    await db.open()
    const jobs = generateJobs()
    for (const job of jobs) {
      await persistenceHelpers.saveJob(job)
    }
    const assessments = generateAssessments(jobs)
    for (const assessment of assessments) {
      await persistenceHelpers.saveAssessment(assessment)
    }
    return {
      jobs: jobs.length,
      candidates: 0, 
      assessments: assessments.length
    }
  } catch (error) {
    console.error('❌ Error generating seed data:', error)
    throw error
  }
}
export async function checkDataExists(): Promise<boolean> {
  try {
    const jobsCount = await db.jobs.count()
    return jobsCount > 0
  } catch (error) {
    return false
  }
}
