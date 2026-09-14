import {
  Ban,
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  FolderDown,
  ListChecks,
  MessageSquare,
  Mic,
  Phone,
  type LucideIcon,
} from 'lucide-react'

export type ServiceCategory = 'Job search' | 'Bookings' | 'Resources & support'

export type Service = {
  slug: string
  title: string
  description: string
  category: ServiceCategory
  icon: LucideIcon
}

export const CATEGORY_ORDER: ServiceCategory[] = [
  'Job search',
  'Bookings',
  'Resources & support',
]

export const SERVICES: Service[] = [
  {
    slug: 'job-hiring',
    title: 'Job Hiring',
    description: 'Current openings, curated by the team.',
    category: 'Job search',
    icon: Briefcase,
  },
  {
    slug: 'do-not-apply-list',
    title: 'Do Not Apply List',
    description: 'Companies you should skip applying to.',
    category: 'Job search',
    icon: Ban,
  },
  {
    slug: 'application-tracker',
    title: 'Application Tracker',
    description: 'Your applies, interviews, resumes, and JDs in one place.',
    category: 'Job search',
    icon: ListChecks,
  },
  {
    slug: 'interview-booking',
    title: 'Interview Booking',
    description: 'Live interview slot availability.',
    category: 'Bookings',
    icon: CalendarCheck,
  },
  {
    slug: 'phone-call-booking',
    title: 'Phone Call Slot Booking',
    description: 'Book a support phone call.',
    category: 'Bookings',
    icon: Phone,
  },
  {
    slug: 'assessment-booking',
    title: 'Assessment Booking',
    description: 'Schedule a candidate assessment.',
    category: 'Bookings',
    icon: ClipboardCheck,
  },
  {
    slug: 'resume-prompt',
    title: 'Resume Tailoring Prompt',
    description: 'A prompt that helps you customize your resume.',
    category: 'Resources & support',
    icon: FileText,
  },
  {
    slug: 'onboarding-list',
    title: 'Onboarding List',
    description: 'Download the onboarding documents pack.',
    category: 'Resources & support',
    icon: FolderDown,
  },
  {
    slug: 'pronunciation-class',
    title: 'Otter & Pronunciation',
    description: 'Mon–Fri 11:30 AM–1:30 PM CST — one class, one join link.',
    category: 'Resources & support',
    icon: Mic,
  },
  {
    slug: 'feedback-form',
    title: 'Support Feedback Form',
    description: 'Anonymous feedback on interview support and suggestions.',
    category: 'Resources & support',
    icon: MessageSquare,
  },
]
