# Mi Menú Semanal

App personal para ver el plan semanal de comidas y cenas, con recetas y
lista de favoritos. Pensada para alojarse gratis en **GitHub Pages** y
usarse desde el iPhone (se puede "Añadir a pantalla de inicio" y se
comporta como una app a pantalla completa).

## Estructura del proyecto

```
index.html          → estructura de la app (cabecera, navegación inferior)
style.css            → estilos (identidad visual "ficha de recetas")
app.js                → toda la lógica (rutas, render, favoritos, buscador)
manifest.json        → metadatos para "Añadir a pantalla de inicio"
icons/                → iconos de la app
data/
  recipes.json        → BASE DE DATOS DE RECETAS
  weeks.json           → BASE DE DATOS DE PLANES SEMANALES
```

No hay build ni dependencias: son ficheros estáticos. Todo el
contenido (recetas y semanas) vive en los dos JSON de `data/`, así que
para añadir contenido nuevo **no hace falta tocar código**.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (puede ser privado o público).
2. Sube todo el contenido de esta carpeta a la raíz del repositorio.
3. En el repositorio: **Settings → Pages → Build and deployment → Source:
   "Deploy from a branch"**, elige la rama `main` y la carpeta `/ (root)`.
4. Guarda. GitHub te dará una URL tipo
   `https://tu-usuario.github.io/tu-repo/`.
5. Ábrela en Safari en el iPhone → botón compartir → **"Añadir a
   pantalla de inicio"**. Se instalará con su propio icono y se abrirá
   a pantalla completa, sin la barra de Safari.

Cada vez que subas cambios (nuevas semanas o recetas) a la rama `main`,
GitHub Pages se actualiza solo en uno o dos minutos.

## Añadir una semana nueva

1. Abre `data/recipes.json` y añade al final del array `recipes` un
   bloque por cada receta nueva de esa semana. Cada receta necesita:

   ```json
   {
     "id": "nombre-unico-en-minusculas-con-guiones",
     "nombre": "Nombre de la receta",
     "categoria": "almuerzo-entrante",
     "semana": "Semana 2",
     "ingredientes": ["Ingrediente 1", "Ingrediente 2"],
     "elaboracion": "Texto de la elaboración. Puedes separar párrafos con una línea en blanco (\\n\\n)."
   }
   ```

   `categoria` debe ser exactamente una de estas cuatro:
   `almuerzo-entrante`, `almuerzo-principal`, `cena-entrante`, `cena-principal`.

   Si una receta se repite tal cual en varias semanas, **no la
   dupliques**: reutiliza el mismo `id` en el plan de la semana nueva.

2. Abre `data/weeks.json` y añade un bloque nuevo dentro del array
   `weeks`:

   ```json
   {
     "id": "semana-2",
     "nombre": "Semana 2",
     "dias": {
       "lunes":     { "almuerzo": ["id-receta-1", "id-receta-2"], "cena": ["id-receta-3", "id-receta-4"] },
       "martes":    { "almuerzo": [...], "cena": [...] },
       "miercoles": { "almuerzo": [...], "cena": [...] },
       "jueves":    { "almuerzo": [...], "cena": [...] },
       "viernes":   { "almuerzo": [...], "cena": [...] },
       "sabado":    { "almuerzo": [...], "cena": [...] },
       "domingo":   { "almuerzo": [...], "cena": [...] }
     }
   }
   ```

   Los `id` que pongas en `almuerzo` y `cena` tienen que coincidir
   exactamente con los `id` que hayas puesto en `recipes.json`.

3. Sube los cambios al repositorio. La nueva semana aparecerá
   automáticamente en el selector de semanas de las pestañas **Hoy** y
   **Semana**, y sus recetas nuevas aparecerán en **Recetas** y en el
   buscador.

No hace falta preocuparse por la fecha: la app siempre mira el día de
la semana en el que estás (lunes, martes...) y muestra lo que
corresponda dentro de la semana seleccionada. Las semanas están
pensadas para repetirse en bucle.

## Funcionamiento de la app

- **Hoy**: muestra el almuerzo y la cena del día de la semana actual,
  dentro de la semana que tengas seleccionada.
- **Semana**: navega cualquier día de la semana seleccionada mediante
  la tira de pestañas Lun–Dom.
- **Recetas**: listado completo con buscador (por nombre o
  ingrediente) y filtro por las cuatro categorías.
- **Favoritos**: recetas marcadas con el corazón, para tenerlas a
  mano sin buscar.

Los favoritos y la semana seleccionada se guardan en el propio
iPhone (`localStorage`), no se sincronizan entre dispositivos.

## Desarrollo / previsualización local

Al ser ficheros estáticos que se cargan con `fetch`, necesitas
servirlos por HTTP (abrir `index.html` con doble clic no funcionará
por las restricciones de seguridad del navegador). Desde esta carpeta:

```bash
python3 -m http.server 8000
```

y abre `http://localhost:8000` en el navegador.
