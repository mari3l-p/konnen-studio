export type ClassType = {
  id: string
  name: string
  image_url: string | null
  duration_mins: number
}

export type Instructor = {
  id: string
  name: string
  bio: string | null
  image_url: string | null
  email: string
}

export type Session = {
  id: string
  starts_at: string
  capacity: number
  price: number
  location: string
  is_cancelled: boolean
  class_types: ClassType
  instructors: Instructor | null
  session_availability?: { spots_left: number }
}

export type Booking = {
  id: string
  session_id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  stripe_payment_intent_id: string | null
  created_at: string
}