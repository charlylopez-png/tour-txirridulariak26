# Porra Tour de Francia 2026

App para llevar la clasificación de la porra entre ~30 participantes. Sin Supabase,
sin servidor: es una web estática (GitHub Pages) donde tú, desde el panel de admin,
guardas cada día los resultados y la web pública se actualiza sola.

## Archivos

- `index.html` — clasificación pública (la que ven todos)
- `admin.html` — panel donde metes los resultados cada día (solo tú)
- `data.json` — donde viven los participantes y los resultados (se actualiza solo, vía commits)
- `motor-puntos.js` — el cálculo de puntos (tabla de puntuación de tu Excel)
- `maestros.js` — listas de corredores/equipos para el autocompletado del admin
- `estilo.css` — estilos

## 1. Subir esto a GitHub Pages

1. Crea un repositorio nuevo en GitHub (puede ser público o privado; si es privado necesitarás GitHub Pages de pago, así que lo normal es público — el `data.json` con los equipos quedará visible, ojo con eso si te importa).
2. Sube todos estos archivos a la raíz del repo (o a una carpeta, ajustando rutas).
3. En el repo → **Settings → Pages** → Source: rama `main`, carpeta `/root`. Guarda.
4. En un par de minutos tendrás la web en `https://TU-USUARIO.github.io/TU-REPO/`.

## 2. Crear tu token de GitHub (para que el admin pueda guardar)

1. Ve a GitHub → foto de perfil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens** → **Generate new token**.
2. Dale un nombre (ej. "porra-tour-admin"), caducidad la que quieras (recomendable 90 días, luego renuevas).
3. En "Repository access" elige **Only select repositories** → selecciona el repo de la porra.
4. En "Permissions" → **Repository permissions** → busca **Contents** → ponlo en **Read and write**.
5. Genera el token y **cópialo ya**, no lo podrás volver a ver.

Este token es como una contraseña: solo tú lo tienes, se guarda únicamente en tu propio
navegador (localStorage), nunca se sube al repositorio ni lo ve nadie más.

## 3. Configurar el panel de admin

1. Abre `https://TU-USUARIO.github.io/TU-REPO/admin.html`
2. Contraseña por defecto: `tour2026` — **cámbiala** editando la constante
   `PASSWORD_ADMIN` al principio del `<script>` en `admin.html` antes de publicar.
   (Recuerda: esto es solo un filtro, no seguridad real — la seguridad real es tu token, que solo tú tienes).
3. En "Configuración de GitHub" rellena:
   - Usuario de GitHub (el dueño del repo)
   - Nombre del repositorio
   - Rama (normalmente `main`)
   - Ruta al archivo (`data.json` si está en la raíz)
   - Tu token
4. Pulsa "Guardar configuración" y luego "Probar conexión" para verificar que todo está bien.

## 4. Meter a los 30 participantes

En la pestaña "Participantes", pega una lista con este formato (una línea por persona):

```
Carlos; POGACAR,SEIXAS,MERLIER,CARAPAZ,VAN EETVELT,GANNA,CORT NIELSEN,HOOLE,SKUJINS; UAE,RED BULL,VISMA
María; VINGEGAARD,EVENEPOEL,PHILIPSEN,...; VISMA,RED BULL,LIDL-TREK
```

Pulsa "Previsualizar" para comprobar que cada uno tiene 9 corredores y 3 equipos,
luego "Añadir a la lista" y finalmente **"Guardar cambios en GitHub"** — este último
paso es el que realmente publica los datos para todos.

## 5. Cada día de etapa

En la pestaña "Añadir etapa":
1. Número de etapa (1, 2, 3...) y nombre opcional.
2. Rellena el top 10 de la etapa, el top 10 de la general, el top 5 de puntos,
   el top 5 de montaña y el top 5 de equipos **tal y como van tras esa etapa**
   (hay autocompletado con los nombres tal cual están en el Excel).
3. "Guardar y publicar etapa". La clasificación pública se recalcula sola.

Si te equivocas, vuelve a la misma pestaña, pon el mismo número de etapa,
pulsa "Cargar etapa existente para editar", corrígela y guarda de nuevo — se
sobrescribe, no se duplica.

## 6. Al terminar el Tour

En la pestaña "Bonus final", mete las clasificaciones **definitivas** (general final,
puntos final, montaña final, equipos final) y guarda. Esto añade el premio gordo
final (600/400/200... pts) a quien corresponda, una sola vez.

## Notas

- Los nombres de corredores/equipos deben escribirse **igual** que en tu Excel
  (mayúsculas o minúsculas da igual, el sistema lo normaliza) para que el motor
  de puntos los reconozca. Usa el autocompletado del admin para evitar errores.
- La tabla de puntos está tal cual tu hoja "Puntuación" original — si en algún
  momento cambia, solo hay que tocar `TABLA_PUNTOS` en `motor-puntos.js`.
- Puedes abrir `admin.html` desde cualquier dispositivo: la configuración
  (usuario/repo/token) se pide de nuevo si cambias de navegador, ya que se
  guarda local a cada dispositivo.
