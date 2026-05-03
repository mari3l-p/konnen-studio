import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: req,
  })

  // Always set the pathname header for the root layout
  res.headers.set('x-pathname', req.nextUrl.pathname)

  // Skip these routes
  const skipped = ['/admin/login', '/admin/set-password', '/auth/callback']
  if (skipped.some(path => req.nextUrl.pathname.startsWith(path))) {
    return res
  }

  // Only protect /admin routes
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          res = NextResponse.next({ request: req })
          res.headers.set('x-pathname', req.nextUrl.pathname)
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  console.log('Middleware → user:', user?.email ?? 'none')

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  console.log('Middleware → adminUser:', adminUser)

  if (!adminUser) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  res.headers.set('x-pathname', req.nextUrl.pathname)
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}