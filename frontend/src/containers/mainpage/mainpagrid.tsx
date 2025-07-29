// 임시로 주석 처리 - 사용되지 않는 컴포넌트
/*
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MemoryGrid() {
  const memories = [
    {
      id: 1,
      title: "첫 여행의 설렘",
      description: "친구들과 함께 떠났던 첫 해외여행, 모든 순간이 소중했습니다.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      title: "졸업식의 감동",
      description: "오랜 노력 끝에 맞이한 졸업식, 가족과 친구들의 축하 속에서.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 3,
      title: "반려동물과의 첫 만남",
      description: "작고 소중한 생명체와의 첫 만남, 잊을 수 없는 순간.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 4,
      title: "잊지 못할 생일 파티",
      description: "서프라이즈로 준비된 생일 파티, 모두에게 감사했습니다.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 5,
      title: "새로운 취미 발견",
      description: "오랫동안 찾던 나만의 취미, 이제는 삶의 활력소.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 6,
      title: "가족과의 행복한 시간",
      description: "따뜻한 햇살 아래 가족들과의 피크닉, 소소한 행복.",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">최근 추억들</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              당신의 소중한 기억들을 한눈에 확인하세요.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 md:grid-cols-2">
          {memories.map((memory) => (
            <Card key={memory.id} className="flex flex-col overflow-hidden">
              <Image
                src={memory.image || "/placeholder.svg"}
                width={300}
                height={200}
                alt={memory.title}
                className="aspect-video w-full object-cover"
              />
              <CardHeader>
                <CardTitle>{memory.title}</CardTitle>
                <CardDescription>{memory.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
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
*/

// 임시 빈 컴포넌트
export default function MemoryGrid() {
  return null;
}