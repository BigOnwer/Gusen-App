"use client"

import { useState, useEffect, useRef, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  MessageCircle,
  Home,
  Compass,
  Bell,
  UserPlus,
  UserCheck,
  Sparkles,
} from "lucide-react"
import { AvatarNav } from "./components/avatar-nav"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { SocialChat } from "@/app/(pages)/dashboard/components/SocialChat"
import { API } from "@/lib/axios"
import { User } from "@/types/user"
import { useRouter } from "next/navigation"
import InstagramStories from "./components/Storys"
import InstagramFeed from "./components/Feed"
import { CreatePostForm } from "./components/CreatePostForm"
import FollowButton from "@/components/FollowButton"
import { useFollowStatus } from "@/hooks/useFollowStatus"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "messages" | "profile" | "post">("home")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
  const [showCreateStory, setShowCreateStory] = useState(false);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const route = useRouter()
  const { isFollowing, setIsFollowing } = useFollowStatus(session?.user.id || '', searchedUsers.id || '');

  const handleCreateStory = () => {
    setShowCreateStory(true);
  };

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) return;

    setIsSearchingUsers(true);
    try {
      const response = await fetch(`/api/user/search?query=${encodeURIComponent(userSearchQuery)}&excludeId=${session?.user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const allUsers = [
    {
      id: 1,
      username: "maria_silva",
      name: "Maria Silva",
      avatar: "/diverse-woman-portrait.png",
      followers: 1234,
      isFollowing: false,
      isVerified: true,
    },
    {
      id: 2,
      username: "joao_dev",
      name: "João Developer",
      avatar: "/thoughtful-man.png",
      followers: 856,
      isFollowing: true,
    },
    {
      id: 3,
      username: "ana_design",
      name: "Ana Designer",
      avatar: "/diverse-designers-brainstorming.png",
      followers: 2341,
      isFollowing: false,
      isVerified: true,
    },
    {
      id: 4,
      username: "carlos_foto",
      name: "Carlos Fotógrafo",
      avatar: "/photographer.png",
      followers: 5678,
      isFollowing: false,
      isVerified: true,
    },
    {
      id: 5,
      username: "lucia_art",
      name: "Lucia Artista",
      avatar: "/diverse-artists-studio.png",
      followers: 987,
      isFollowing: false,
    },
    {
      id: 6,
      username: "pedro_music",
      name: "Pedro Músico",
      avatar: "/diverse-musician-ensemble.png",
      followers: 3456,
      isFollowing: false,
    },
    {
      id: 7,
      username: "sofia_travel",
      name: "Sofia Viajante",
      avatar: "/lone-traveler-mountain-path.png",
      followers: 7890,
      isFollowing: false,
      isVerified: true,
    },
    {
      id: 8,
      username: "lucas_chef",
      name: "Lucas Chef",
      avatar: "/diverse-chef-preparing-food.png",
      followers: 2134,
      isFollowing: false,
    },
    {
      id: 9,
      username: "camila_fitness",
      name: "Camila Fitness",
      avatar: "/placeholder.svg?height=40&width=40",
      followers: 4567,
      isFollowing: false,
    },
    {
      id: 10,
      username: "rafael_tech",
      name: "Rafael Tech",
      avatar: "/placeholder.svg?height=40&width=40",
      followers: 1890,
      isFollowing: false,
    },
  ]

  const handleFollow = (userId: string) => {
    setFollowingUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  // Função para buscar contagem inicial de mensagens não lidas
  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/conversations/unread-count?userId=${session.user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setUnreadMessagesCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens não lidas:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Buscar contagem quando o usuário estiver disponível
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  // Handler para atualizar contagem quando o componente SocialChat atualizar
  const handleUnreadCountChange = (count: number) => {
    setUnreadMessagesCount(count);
  };

  useEffect(() => {
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (userSearchQuery.trim().length >= 2) {
      userSearchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 500);
    } else {
      setSearchedUsers([]);
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [userSearchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link href={'/dashboard'} className="text-2xl font-bold bg-gradient-to-r from-primary to-[#5ce1e6] bg-clip-text text-transparent">
                Gusen App
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar usuários, hashtags..."
                  className="pl-10 bg-muted/50 border-0 focus:bg-background"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>

              {searchedUsers.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-hidden z-50 shadow-lg">
                  <div className="p-3 border-b border-border">
                    <h3 className="font-semibold text-sm">Resultados da busca</h3>
                  </div>
                  <ScrollArea className="max-h-80">
                    <div className="p-2">
                      {searchedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer"
                        >
                          <div
                            className="flex items-center space-x-3"
                            onClick={() => {
                              route.push(`/user/${user.username}`)
                            }}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-1">
                                <p className="font-semibold text-sm">{user.username}</p>
                                {user.isVerified && (
                                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.followers} seguidores
                              </p>
                            </div>
                          </div>
                          <FollowButton
                            userId={session?.user.id || ''}
                            targetUserId={user.id || ''} 
                            isFollowing={isFollowing || false}
                            onFollowChange={setIsFollowing}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveTab("post")}>
                <Sparkles />
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveTab("messages")}>
                <MessageCircle className="h-5 w-5" />
                {unreadMessagesCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive flex items-center justify-center">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive">5</Badge>
              </Button>
                <AvatarNav user={session?.user}/>
            </div>
          </div>
        </div>
      </header>

      {showSearchResults && <div className="fixed inset-0 z-40" onClick={() => setShowSearchResults(false)} />}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "home" && (
              <div className="space-y-6">
                {/* Stories */}
                <InstagramStories currentUserId={session?.user.id} apiBaseUrl="api/" onCreateStory={handleCreateStory}/>

                {/* Posts Feed */}
                <InstagramFeed userId={session?.user.id} apiBaseUrl="api/"/>
              </div>
            )}

            {activeTab === "messages" && (
              <SocialChat
              currentUser={session?.user} 
              onUnreadCountChange={handleUnreadCountChange}
              />
            )}

            {activeTab === "post" && (
              <CreatePostForm userId={session?.user.id || ''} onPostCreated={() => {}} setTab={setActiveTab}/>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navigation */}
            <Card className="p-4">
              <nav className="space-y-2">
                <Button
                  variant={activeTab === "home" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("home")}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Início
                </Button>
                <Button
                  variant={activeTab === "explore" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("explore")}
                >
                  <Compass className="h-4 w-4 mr-3" />
                  Explorar
                </Button>
                <Button
                  variant={activeTab === "messages" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("messages")}
                >
                  <MessageCircle className="h-4 w-4 mr-3" />
                  Mensagens
                </Button>
              </nav>
            </Card>

            {/* Suggestions */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Sugestões para você</h3>
              <div className="space-y-3">
                {[
                  { username: "pedro_music", avatar: "/diverse-musician-ensemble.png" },
                  { username: "sofia_travel", avatar: "/lone-traveler-mountain-path.png" },
                  { username: "lucas_chef", avatar: "/diverse-chef-preparing-food.png" },
                ].map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">Sugerido para você</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Seguir
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
