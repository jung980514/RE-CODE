import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MainPageGrid() {
  const memories = [
    {
      id: 1,
      title: "치매 100만 명 시대",
      description: "노인 인구의 9.25% 즉 10명 중 1명은 치매를 앓고 있고 28%는 치매로 악화할 위험이 있는 '경도인지장애' 상태인 것으로 파악됐습니다.",
      image: "/images/비로그인썸네일1.avif",
      link: "https://www.youtube.com/watch?v=jRxPKnhj9Ic",
    },
    {
      id: 2,
      title: "회상치료의 효과",
      description: "어머니가 밤늦도록 재봉틀로 옷을 기워주시던 기억, 이러한 어릴 적 좋은 기억들을 회상하는 것으로 치매환자의 삶의 질 개선에 도움을 줍니다.",
      image: "/images/비로그인썸네일2.jpg",
      link: "https://www.youtube.com/watch?v=26lhBW4fAbo",
    },
    {
      id: 3,
      title: "치매의 새로운 치료, 추억 치료",
      description: "치매를 세상에서 가장 슬픈 병이라고 합니다. 최근 미국의 한 돌봄 센터가 특별한 방법으로 치매 환자들의 기억 향상을 돕고 있어 주목받고 있습니다.",
      image: "/images/비로그인썸네일3.jpg",
      link: "https://www.youtube.com/watch?v=hX-GF8lPz9Q",
    },
  ]
  
  const cardBgClasses = ["bg-rose-50", "bg-indigo-50", "bg-emerald-50"]

return (
    <section className="w-full py-12 md:py-24 lg:py-32 w-screen">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-2">
          </div>
        </div>
        <div className="text-3xl mx-auto grid max-w-8xl items-start gap-6 py-12 lg:grid-cols-3 md:grid-cols-2">
          {memories.map((memory, index) => (
            <Card
              key={memory.id}
              className={`group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardBgClasses[index % cardBgClasses.length]}`}
            >
              <Image
                src={memory.image || "/placeholder.svg"}
                width={300}
                height={200}
                alt={memory.title}
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <CardHeader>
                <CardTitle className="transition-colors group-hover:text-primary">{memory.title}</CardTitle>
                <CardDescription className="text-xl font-bold">{memory.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={memory.link} target="_blank" className="text-sm font-medium text-primary hover:underline">
                  자세히 보기
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}