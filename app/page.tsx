import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Users, Shield, Zap, ArrowRight, Star } from "lucide-react"
import Image from "next/image"
import vibrantImage from '@/public/vibrant-community-connection.png'
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Gusen App</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost">Sobre</Button>
            <Button variant="ghost">Recursos</Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Link href={'/auth'}>
                Entrar
              </Link>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            <Star className="h-3 w-3 mr-1" />
            Nova experiência social
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Conecte-se com o mundo de forma autêntica
          </h1>

          <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
            Gusen App é a rede social que valoriza conexões reais, conversas significativas e comunidades que importam.
            Junte-se a milhões de pessoas compartilhando momentos únicos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
              <Link href={'/auth'}>
                Começar agora
              </Link>
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              Ver demonstração
            </Button>
          </div>

          <div className="relative">
            <Image
              src={vibrantImage}
              width={10000}
              height={10000}
              alt="Interface do Gusen App"
              className="w-full max-w-3xl mx-auto rounded-xl shadow-2xl border border-border"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-xl"></div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Por que escolher o Gusen App?</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Recursos pensados para uma experiência social mais rica e segura
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Comunidades Ativas</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Encontre e participe de comunidades que compartilham seus interesses e paixões
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Privacidade Garantida</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Seus dados são protegidos com criptografia de ponta e controles de privacidade avançados
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Interface Intuitiva</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Design moderno e responsivo que funciona perfeitamente em todos os dispositivos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Veja como funciona</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Uma prévia da experiência que te espera no Gusen App
            </p>
          </div>

          <div className="space-y-6">
            {[1, 2].map((post) => (
              <Card key={post} className="overflow-hidden max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">U{post}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Usuário Exemplo</h4>
                      <p className="text-sm text-muted-foreground">há 2 horas</p>
                    </div>
                  </div>

                  <p className="text-card-foreground mb-4 leading-relaxed">
                    {post === 1
                      ? "Adorando a nova interface do Gusen App! Finalmente uma rede social que prioriza conexões reais 🚀"
                      : "Acabei de me juntar a uma comunidade incrível de fotógrafos aqui. A qualidade das discussões é impressionante! 📸"}
                  </p>

                  <div className="flex items-center gap-6 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Heart className="h-4 w-4 mr-2" />
                      {42 + post * 15}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {8 + post * 3}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Pronto para se conectar?</h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Junte-se a milhares de pessoas que já descobriram uma nova forma de se conectar
          </p>

          <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-12">
            <Link href={'/auth'}>
                Criar conta gratuita
            </Link>
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Gratuito para sempre • Sem anúncios invasivos • Privacidade garantida
          </p>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <h3 className="text-xl font-bold text-primary mb-4">Gusen App</h3>
          <p className="text-muted-foreground mb-6">Conectando pessoas de forma autêntica desde 2024</p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">
              Privacidade
            </a>
            <a href="#" className="hover:text-primary">
              Termos
            </a>
            <a href="#" className="hover:text-primary">
              Suporte
            </a>
            <a href="#" className="hover:text-primary">
              Sobre
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
