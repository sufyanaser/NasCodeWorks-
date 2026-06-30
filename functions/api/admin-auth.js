function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
  })
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || ''
  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

export async function onRequest({ request, env }) {
  const expectedCode = env.ADMIN_ACCESS_CODE || 'nascw2026'
  const sessionCookie = getCookie(request, 'nascw_admin_ok')

  if (request.method === 'GET') {
    return json({
      ok: true,
      configured: true,
      authenticated: sessionCookie === '1',
      mode: env.ADMIN_ACCESS_CODE ? 'env' : 'fallback',
    })
  }

  if (request.method === 'POST') {
    let body = {}
    try {
      body = await request.json()
    } catch {
      return json({ ok: false, authenticated: false, message: 'Invalid request body' }, { status: 400 })
    }

    const code = String(body.code || '').trim()
    if (code !== expectedCode) {
      return json({ ok: true, authenticated: false, message: 'الرمز غير صحيح' }, { status: 401 })
    }

    return json(
      { ok: true, authenticated: true },
      {
        headers: {
          'set-cookie': 'nascw_admin_ok=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400',
        },
      },
    )
  }

  if (request.method === 'DELETE') {
    return json(
      { ok: true, authenticated: false },
      {
        headers: {
          'set-cookie': 'nascw_admin_ok=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
        },
      },
    )
  }

  return json({ ok: false, message: 'Method not allowed' }, { status: 405 })
}
