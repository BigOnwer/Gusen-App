import Image from "next/image";
import { Button } from "./ui/button";
import logo from '@/public/Design_sem_nome__1_-removebg-preview.png'

export function Header() {
    return(
        <header className="flex items-center justify-between">
            <div className="flex items-center">
                <Image src={logo} alt="" className="w-12"/>
                <h1>Gusen App</h1>
            </div>
            <div className="space-x-1">
                <Button variant={"outline"}>Entrar</Button>
                <Button>Registrar</Button>
            </div>
        </header>
    )
}