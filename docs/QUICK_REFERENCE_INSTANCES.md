# 🚀 Quick Reference - Verificação de Instâncias

## ⚡ Comandos Rápidos

### 1️⃣ Inserir Dados de Teste (SQL)
```sql
-- Execute no Supabase SQL Editor
SELECT insert_test_instances(auth.uid());
```

### 2️⃣ Verificar Instâncias (SQL)
```sql
-- Execute no Supabase SQL Editor
SELECT instanceName, status, profileName
FROM instances
WHERE user_id = auth.uid();
```

### 3️⃣ Verificar no Console do Navegador
```javascript
// Execute no console (F12) após fazer login
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase.from('instances').select('*').eq('user_id', user.id);
console.table(data);
```

### 4️⃣ Teste Completo no Navegador
```javascript
// Execute no console (F12)
import('./test-instance-listing-browser.js').then(m => {
  window.testInstanceListing = m.testInstanceListing;
  testInstanceListing();
});
```

---

## 📋 Checklist Rápido

- [ ] Aplicação rodando (`npm run dev`)
- [ ] Usuário logado
- [ ] Tabela `instances` criada
- [ ] Dados de teste inseridos
- [ ] Página `/instances` carrega
- [ ] Instâncias aparecem na UI
- [ ] Console sem erros críticos

---

## 🔧 Troubleshooting Rápido

| Problema | Solução Rápida |
|----------|----------------|
| "No instances yet" | `SELECT insert_test_instances(auth.uid());` |
| Erro PGRST116 | Inserir dados de teste (comando acima) |
| User ID diferente | `UPDATE instances SET user_id = auth.uid();` |
| Sync falha | Verificar `.env` e reiniciar app |

---

## 📁 Arquivos Importantes

### Testes
- `test-instance-listing-browser.ts` - Teste no navegador
- `test-instance-listing.ts` - Teste CLI
- `migrations/verify_instances_setup.sql` - Verificação SQL

### Documentação
- `docs/TESTING_INSTANCE_LISTING.md` - Guia completo
- `docs/SETUP_INSTANCES.md` - Configuração inicial

### Produção (NÃO MODIFICAR)
- `services/instanceService.ts` - Lógica principal
- `pages/Instances.tsx` - Interface

---

## 🎯 Resultado Esperado

Após executar os comandos acima, você deve ver:

**No Supabase:**
- 3 instâncias de teste criadas
- 2 com status `'open'`
- 1 com status `'close'`

**Na UI (`/instances`):**
- Lista com 3 instâncias
- Status visual (verde/vermelho)
- Botões de ação funcionando

**No Console:**
- Logs de sync periódico
- Sem erros críticos
- `Found 3 instances`

---

## 💡 Dica

Para um diagnóstico completo, execute:
```bash
# No Supabase SQL Editor
migrations/verify_instances_setup.sql
```

Este script verifica:
- ✅ Tabela existe
- ✅ RLS ativo
- ✅ Políticas corretas
- ✅ Dados presentes
- ✅ Índices criados
