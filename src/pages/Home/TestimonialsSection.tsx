import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/common/SectionHeading'

const avatarColors = ['#6366f1', '#8b5cf6', '#06b6d4']

interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
}

export function TestimonialsSection() {
  const { t } = useTranslation()
  const testimonials = t('testimonials.items', { returnObjects: true }) as Testimonial[]

  return (
    <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t('testimonials.title')}
          subtitle={t('testimonials.subtitle')}
        />

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 flex flex-col"
            >
              {/* Quote mark */}
              <div className="text-5xl font-serif text-brand-300 dark:text-brand-700 leading-none mb-4 select-none">
                "
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1 text-sm">
                {item.quote}
              </p>

              {/* Stars */}
              <div className="flex gap-0.5 my-4">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: avatarColors[i] }}
                >
                  {item.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role} · {item.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
