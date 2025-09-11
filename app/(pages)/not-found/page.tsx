import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">😞</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Usuário não encontrado</h1>
        <p className="text-gray-600 mb-4">Este perfil não existe ou foi removido.</p>
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}