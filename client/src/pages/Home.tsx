import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import FeatureCard from '../components/FeatureCard'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'

const features = [
  {
    icon: '📋',
    title: 'Track every application',
    description:
      'Company, recruiter, source and status in one place, with every status change logged automatically.',
  },
  {
    icon: '🤖',
    title: 'Paste a job description',
    description:
      'AI pulls out the title, location, salary and required skills so you never retype a listing.',
  },
  {
    icon: '🎯',
    title: 'Spot your skill gaps',
    description:
      'See which skills keep appearing in the jobs you want that are missing from your CV.',
  },
  {
    icon: '📈',
    title: 'Understand your funnel',
    description:
      'Find out how long each stage takes and where applications drop off.',
  },
]

function Home() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-linear-to-br from-cyan-500 to-teal-600 px-6 py-24 text-center text-white">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-5xl">
            Your job search, organised and understood
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cyan-50">
            Track applications, extract skills from job descriptions with AI,
            and see exactly what your CV is missing.
          </p>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="mt-10 inline-block rounded-full bg-white px-8 py-4 text-lg font-semibold text-teal-700 shadow-lg hover:bg-cyan-50"
          >
            {user ? 'Go to dashboard' : 'Get Started'}
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            What it does
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
