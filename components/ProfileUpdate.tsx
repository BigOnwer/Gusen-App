"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, User, Mail, Phone, Lock } from "lucide-react"

interface ProfileData {
  name: string
  email: string
  phone: string
  bio: string
  profileImage: string
}

interface PrivacySettings {
  profileVisible: boolean
  showEmail: boolean
  showPhone: boolean
  allowMessages: boolean
}

type ProfileField = keyof ProfileData
type PrivacySetting = keyof PrivacySettings

export function ProfileUpdatePage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "+55 11 99999-9999",
    bio: "Desenvolvedor apaixonado por tecnologia e inovação. Sempre em busca de novos desafios.",
    profileImage: "/professional-headshot.png",
  })

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    allowMessages: true,
  })

  const [bioLength, setBioLength] = useState<number>(profileData.bio.length)
  const maxBioLength: number = 160

  const handleInputChange = (field: ProfileField, value: string): void => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
    if (field === "bio") {
      setBioLength(value.length)
    }
  }

  const handlePrivacyChange = (setting: PrivacySetting, value: boolean): void => {
    setPrivacySettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file: File | undefined = event.target.files?.[0]
    if (file) {
      const imageUrl: string = URL.createObjectURL(file)
      setProfileData((prev) => ({ ...prev, profileImage: imageUrl }))
    }
  }

  const handleSave = (): void => {
    // Lógica de salvamento seria implementada aqui
    console.log("Salvando dados:", { profileData, privacySettings })
  }

  const handleCancel = (): void => {
    // Lógica de cancelamento seria implementada aqui
    console.log("Cancelando alterações")
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Atualize Seu Perfil</h1>
          <p className="text-muted-foreground">
            Mantenha suas informações sempre atualizadas para uma melhor experiência
          </p>
        </div>

        {/* Profile Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto do Perfil
            </CardTitle>
            <CardDescription>Escolha uma foto que represente você</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.profileImage || "/placeholder.svg"} alt="Foto do perfil" />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <label htmlFor="profile-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para fazer upload de uma foto</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize seus dados básicos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="seu.email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+55 11 99999-9999"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card>
          <CardHeader>
            <CardTitle>Biografia</CardTitle>
            <CardDescription>Conte um pouco sobre você em poucas palavras</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Escreva uma breve descrição sobre você..."
                className="min-h-[100px] resize-none"
                maxLength={maxBioLength}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descreva seus interesses e personalidade</span>
                <span className={`${bioLength > maxBioLength * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                  {bioLength}/{maxBioLength}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Configurações de Privacidade
            </CardTitle>
            <CardDescription>Controle quem pode ver suas informações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Perfil Visível</Label>
                <p className="text-sm text-muted-foreground">Permite que outros usuários encontrem seu perfil</p>
              </div>
              <Switch
                checked={privacySettings.profileVisible}
                onCheckedChange={(checked) => handlePrivacyChange("profileVisible", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Mostrar Email</Label>
                <p className="text-sm text-muted-foreground">Exibe seu email no perfil público</p>
              </div>
              <Switch
                checked={privacySettings.showEmail}
                onCheckedChange={(checked) => handlePrivacyChange("showEmail", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Mostrar Telefone</Label>
                <p className="text-sm text-muted-foreground">Exibe seu telefone no perfil público</p>
              </div>
              <Switch
                checked={privacySettings.showPhone}
                onCheckedChange={(checked) => handlePrivacyChange("showPhone", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Permitir Mensagens</Label>
                <p className="text-sm text-muted-foreground">Outros usuários podem enviar mensagens diretas</p>
              </div>
              <Switch
                checked={privacySettings.allowMessages}
                onCheckedChange={(checked) => handlePrivacyChange("allowMessages", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button className="flex-1" size="lg" onClick={handleSave}>
            Salvar Alterações
          </Button>
          <Button variant="outline" size="lg" className="sm:w-auto bg-transparent" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Ajuda
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Termos de Serviço
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
