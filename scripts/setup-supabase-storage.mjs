import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in environment.')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment. This script requires an admin key.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const BUCKETS = [
  {
    name: 'apple-candy-images',
    public: true,
    description: 'Generated apple candy base and toppings composites.',
  },
  {
    name: 'purikura-photos',
    public: true,
    description: 'Final purikura photos with hand overlays.',
  },
]

async function ensureBucket({ name, public: isPublic }) {
  const { data: existing, error: getError } = await supabase.storage.getBucket(name)

  const isMissing = getError && (getError.status === 404 || getError.message?.toLowerCase().includes('not found'))

  if (getError && !isMissing) {
    throw new Error(`Failed to inspect bucket "${name}": ${getError.message}`)
  }

  if (existing) {
    console.log(`Bucket "${name}" already exists; skipping.`)
    return
  }

  const { error: createError } = await supabase.storage.createBucket(name, {
    public: isPublic,
    fileSizeLimit: 10485760,
  })

  if (createError) {
    throw new Error(`Failed to create bucket "${name}": ${createError.message}`)
  }

  console.log(`Bucket "${name}" created.`)
}

async function main() {
  for (const bucket of BUCKETS) {
    await ensureBucket(bucket)
  }

  console.log('Supabase storage buckets are ready.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
