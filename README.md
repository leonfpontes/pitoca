# 🐈‍⬛ Pitoca Remédios

Aplicativo web para acompanhamento dos medicamentos da Pitoca — SRD Felina, 4,9kg.

Desenvolvido para facilitar o controle diário do tratamento pela família, com foco em usabilidade mobile.

## ✨ Funcionalidades

- **Timeline diária** agrupada por horário com status visual (atrasado, iminente, dado, futuro)
- **Registro de dose** com horário real de administração
- **Navegação por dia** (ver dias anteriores e futuros)
- **Cards de remédios** com progresso individual, posologia e via de administração
- **Banner de cuidados** com alertas, horários de alimentação e sinais de atenção
- **Easter egg** — gatinho preto animado que aparece eventualmente na tela
- **Estrelas e estrelas cadentes** no fundo para um visual noturno
- **Persistência local** via `localStorage` (sem servidor, sem conta)

## 🧪 Tecnologias

- HTML5, CSS3, JavaScript ES6+ puro
- Zero dependências externas
- Funciona offline direto no navegador

## 📁 Estrutura

```
pitoca/
├── index.html
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── layout.css
│   ├── banner.css
│   ├── timeline.css
│   ├── cards.css
│   ├── modal.css
│   └── mobile.css
└── js/
    ├── data.js        — prescrição médica (fonte da verdade)
    ├── storage.js     — persistência no localStorage
    ├── scheduler.js   — geração e status das doses
    ├── renderer.js    — renderização da UI
    ├── ui.js          — eventos e modais
    └── app.js         — entry point e loop de atualização
```

## 🚀 Deploy

Disponível em: **[pitoca.vercel.app](https://pitoca.vercel.app)**

## 🐾 Sobre a Pitoca

Pitoca é uma gatinha SRD de 4,9kg em tratamento veterinário. Este app foi criado com carinho para que sua família nunca perca um remédio. 💜
