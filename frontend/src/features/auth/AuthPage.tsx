import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { loginSchema, registerSchema } from '../../types/api'
import type { Credentials } from '../../types/api'
import { ErrorState, Field } from '../../components/ui'
import { safeNext } from '../../app/guards'
import { useToast } from '../../app/state'

export default function AuthPage({ registerMode = false }: { registerMode?: boolean }) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const { notify } = useToast()
  const [params] = useSearchParams()
  const form = useForm<Credentials>({
    resolver: zodResolver(registerMode ? registerSchema : loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: async (values: Credentials) => {
      if (registerMode) {
        await api.register(values)
        notify('Conta criada. Entre com sua senha para continuar.')
        navigate(`/entrar?next=${encodeURIComponent(safeNext(params.get('next')))}`)
        return null
      }
      await client.cancelQueries({ queryKey: ['identity'] })
      return api.login(values)
    },
    retry: false,
    onSuccess: (user) => {
      form.reset()
      if (user) {
        client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'identity' })
        client.setQueryData(['identity'], user)
        notify('Bem-vindo à sua conta.')
        navigate(
          params.has('next')
            ? safeNext(params.get('next'))
            : user.role === 'ADMIN'
              ? '/admin'
              : '/pedidos',
          { replace: true },
        )
      }
    },
  })
  const errors = form.formState.errors
  return (
    <section className="auth-shell">
      <div className="auth-story">
        <span className="eyebrow">BEM-VINDO AO SEU UNIVERSO</span>
        <h1>
          Boas escolhas.
          <br />
          Novas <em>órbitas.</em>
        </h1>
        <p>Um espaço para descobrir, escolher e acompanhar cada pedido, do começo ao fim.</p>
        <div className="auth-orbit">
          <div className="sphere" />
          <span />
          <span />
        </div>
        <span className="auth-caption">ORDERSPHERE / SUA PRÓXIMA DESCOBERTA</span>
      </div>
      <div className="auth-form">
        <span className="eyebrow">{registerMode ? 'VAMOS COMEÇAR' : 'BOM TER VOCÊ AQUI'}</span>
        <h2>{registerMode ? 'Crie sua conta' : 'Entre na sua conta'}</h2>
        <p className="muted">
          {registerMode
            ? 'Seus próximos pedidos começam por aqui.'
            : 'Continue de onde você parou.'}
        </p>
        {mutation.error && (
          <ErrorState
            error={mutation.error}
            message={
              !registerMode && mutation.error instanceof ApiError && mutation.error.status === 401
                ? 'E-mail ou senha inválidos. Confira seus dados.'
                : undefined
            }
          />
        )}
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
          <Field id="email" label="E-mail" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              {...form.register('email')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </Field>
          <Field id="password" label="Senha" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              autoComplete={registerMode ? 'new-password' : 'current-password'}
              {...form.register('password')}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? 'password-error' : registerMode ? 'password-hint' : undefined
              }
            />
          </Field>
          {registerMode && (
            <p id="password-hint" className="field-hint">
              12 a 64 caracteres, até 72 bytes UTF-8.
            </p>
          )}
          <button className="button wide" disabled={mutation.isPending}>
            {mutation.isPending ? 'Processando…' : registerMode ? 'Criar minha conta' : 'Entrar'}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {registerMode ? 'Já tem uma conta?' : 'Sua primeira visita?'}{' '}
          <Link
            to={`${registerMode ? '/entrar' : '/cadastro'}${params.has('next') ? `?next=${encodeURIComponent(safeNext(params.get('next')))}` : ''}`}
          >
            {registerMode ? 'Entrar' : 'Criar conta'}
          </Link>
        </p>
        <p className="privacy-note">
          <LockKeyhole size={14} />A aplicação não salva sua senha no armazenamento do navegador.
        </p>
      </div>
    </section>
  )
}
