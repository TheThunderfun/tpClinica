# TpClinica

Pagina Web:https://tpclinica-1845c.web.app

# Pantalla de Login

## Descripción

Permite al usuario ingresar con email y contraseña para acceder a la aplicación.

## Componentes y Elementos

- Formulario con campos: email y contraseña.
- Botón de ingreso.
- Mensajes de error si las credenciales son inválidas.
- 6 botones de acceso rápido:

2 especialistas

1 administrador

3 pacientes

# Pantalla de Registro de Usuario

## Descripción

Pantalla donde el usuario puede registrarse como Paciente o Especialista, completando datos personales y específicos según el tipo.

## Componentes y Elementos

- Selector de tipo de usuario (Paciente o Especialista).
- Formulario reactivo con campos: nombre, apellido, edad, DNI, email, contraseña.
- Campos específicos para paciente: obra social, dos imágenes de perfil.
- Campos específicos para especialista: especialidades (multi-select), checkbox para agregar otra, imagen de perfil.
- Componente Captcha para validación humana.
- Botón "Registrar" que solo se habilita si el formulario es válido y el captcha fue resuelto correctamente.

## Funcionalidades

- Validaciones en cada campo (obligatorio, formato, números mayores a 0, etc).
- Validación dinámica de campos según el tipo de usuario seleccionado.
- Permite cargar imágenes para el perfil.
- Integración con componente captcha para evitar registros automatizados.

## Integraciones y Eventos

- Envío del formulario a función `agregarUsuario()` que procesa los datos.
- Uso de Reactive Forms para control de validación.
- Comunicación con componente `<app-captcha>` para validar respuesta humana.

# Pantalla de Bienvenida

## Descripción

Pantalla inicial que recibe al usuario y presenta la app. Sirve como punto de partida para navegar a login o registro.

## Componentes y Elementos

- Mensaje de bienvenida.
- Botones o enlaces para ir a Login o Registro.

## Funcionalidades

- Redirecciona al usuario según la acción seleccionada (login o registro).
- Puede incluir animaciones o mensajes dinámicos.

## Integraciones y Eventos

- Navegación a rutas internas (login, registro).

# Pantalla de Usuarios (Administración)

## Descripción

Pantalla exclusiva para el administrador donde puede gestionar usuarios, incluyendo registrar nuevos administradores y validar acceso de otros usuarios.

## Componentes y Elementos

- Tabla/lista de usuarios registrados con detalles básicos.
- Formulario para registrar nuevos administradores.
- Botones para validar, activar o desactivar usuarios.
- Filtros o búsqueda para facilitar la gestión.

## Funcionalidades

- Registro de nuevos administradores con validaciones.
- Validación manual o automática de usuarios existentes.
- Visualización de estado y roles de usuarios.
