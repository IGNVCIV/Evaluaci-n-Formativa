const $ = (id) => document.getElementById(id);

function showError(el, msg){
  if(!el) return;
  el.classList.add("is-invalid");

  const alert = $("#errorAlert");
  if (alert) {
    alert.classList.remove("d-none");
    alert.textContent = msg;
  } else {

    alert(msg);
  }
}
function clearErrors(form){
  if(!form) return;
  form.querySelectorAll(".is-invalid").forEach(n => n.classList.remove("is-invalid"));
  const alert = $("#errorAlert");
  if (alert){
    alert.classList.add("d-none");
    alert.textContent = "";
  }
}

function rutValido(rut, dv){
  if(!rut || !dv) return false;
  if(rut.length < 1 || rut.length > 8) return false;
  dv = dv.toUpperCase();
  if(!("0123456789K".includes(dv))) return false;
  let suma = 0, multiplicador = 2;
  for(let i = rut.length - 1; i >= 0; i--){
    const dig = parseInt(rut[i], 10);
    if(Number.isNaN(dig)) return false;
    suma += dig * multiplicador;
    multiplicador = (multiplicador === 7) ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const dvCalculado = (resto === 11) ? "0" : (resto === 10) ? "K" : String(resto);
  return dv === dvCalculado;
}
function textoValido(valor, obligatorio = true){
  if(!valor && !obligatorio) return true;
  if(!valor) return false;
  return valor.trim().length >= 2;
}
function fechaNacimientoValida(isoDate){
  if(!isoDate) return false;
  const hoy = new Date();
  const fecha = new Date(isoDate + "T00:00:00");
  if(isNaN(fecha.getTime())) return false;
  if(fecha > hoy) return false;
  const min = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  return fecha <= min;
}
function correoValido(email){
  if(!email) return false;
  return email.includes("@") && email.includes(".");
}
function telefonoValido(tel){
  if(!tel) return true; 
  const soloDigitos = tel.replace(/\D+/g, "");
  return soloDigitos.length === 9 || soloDigitos.length === 10;
}

//Cargar mi Storage
function cargarColeccion(nombre){
  try{
    const raw = localStorage.getItem(nombre);
    return raw ? JSON.parse(raw) : [];
  }catch(_){ return []; }
}
function guardarColeccion(nombre, arr){
  localStorage.setItem(nombre, JSON.stringify(arr, null, 2));
}

async function guardarRegistro({usuario, password, persona}){

  const usuarios = cargarColeccion("Usuarios");
  const personas = cargarColeccion("Personas");


  if(!usuario || usuario.trim().length < 3){
    showError($("usuario"), "El nombre de usuario es obligatorio (mín. 3 caracteres).");
    return {ok:false, msg:"usuario inválido"};
  }
  if(!password || password.trim().length === 0){
    showError($("password"), "La contraseña no puede estar vacía.");
    return {ok:false, msg:"password vacío"};
  }

  const yaExiste = usuarios.some(u => (u.usuario || "").toLowerCase() === usuario.toLowerCase());
  if(yaExiste){
    showError($("usuario"), "Ese usuario ya existe, prueba con otro.");
    return {ok:false, msg:"usuario duplicado"};
  }

  const nuevoUsuario = { usuario: usuario.trim(), password: password };
  const nuevaPersona = { ...persona, usuario: usuario.trim() };

  usuarios.push(nuevoUsuario);
  personas.push(nuevaPersona);

  guardarColeccion("Usuarios", usuarios);
  guardarColeccion("Personas", personas);

  return {ok:true, usuarios, personas};
}

//Formulario
function manejarSubmitRegistro(e){
  e.preventDefault();
  const form = e.target;

  const terminos = $("terminos");
  const msgChk = form.querySelector(".check-wrap .error-msg");
  if(!terminos.checked){
    if(msgChk){ msgChk.classList.add("error-show"); }
    terminos.classList.add("is-invalid");
    return;
  }else{
    if(msgChk){ msgChk.classList.remove("error-show"); }
    terminos.classList.remove("is-invalid");
  }

  clearErrors(form);
  const usuarioEl = $("usuario");
  const passwordEl = $("password");

  const rut = $("rut");
  const dv = $("dv");
  const nombres = $("nombres");
  const ape1 = $("ape1");
  const ape2 = $("ape2");
  const fec_nac = $("fec_nac");
  const correo = $("correo");
  const telefono = $("telefono");
  const direccion = $("direccion");
  const regiones = $("regiones");

  let ok = true;

  if(!rutValido(rut.value.trim(), dv.value.trim())){
    ok = false; showError(dv, "RUT inválido. Revísalo (DV incluido).");
  }
  if(!textoValido(nombres.value)) { ok = false; showError(nombres, "Ingresa tu nombre (mín. 2 letras)."); }
  if(!textoValido(ape1.value))    { ok = false; showError(ape1,    "Ingresa tu apellido paterno."); }
  if(ape2.value && !textoValido(ape2.value, false)) { ok = false; showError(ape2, "Apellido materno inválido."); }

  if(!fechaNacimientoValida(fec_nac.value)) {
    ok = false; showError(fec_nac, "Debes ser mayor de 18 y no puede ser una fecha futura.");
  }
  if(!correoValido(correo.value.trim())) {
    ok = false; showError(correo, "Correo inválido.");
  }
  if(!telefonoValido(telefono.value)) {
    ok = false; showError(telefono, "Teléfono inválido (usa 9 o 10 dígitos).");
  }
  if(direccion.value && direccion.value.trim().length < 5){
    ok = false; showError(direccion, "Dirección demasiado corta.");
  }
  if(!regiones.value){
    ok = false; showError(regiones, "Selecciona una región.");
  }

  if(!usuarioEl || !usuarioEl.value.trim()){
    ok = false; showError(usuarioEl, "El nombre de usuario es obligatorio.");
  }
  if(!passwordEl || !passwordEl.value.trim()){
    ok = false; showError(passwordEl, "La contraseña no puede estar vacía.");
  }

  if(!ok) return;

  const persona = {
    rut: rut.value.trim(),
    dv: dv.value.trim().toUpperCase(),
    rutCompleto: `${rut.value.trim()}-${dv.value.trim().toUpperCase()}`,
    nombres: nombres.value.trim(),
    apellidoPaterno: ape1.value.trim(),
    apellidoMaterno: (ape2.value || "").trim(),
    fechaNacimiento: fec_nac.value,
    correo: correo.value.trim(),
    telefono: (telefono.value || "").replace(/\D+/g, ""),
    direccion: (direccion.value || "").trim(),
    region: regiones.value
  };

  guardarRegistro({
    usuario: usuarioEl.value.trim(),
    password: passwordEl.value,
    persona
  }).then(res => {
    if(!res.ok) return;

    const okAlert = $("#successAlert");
    if(okAlert){
      okAlert.classList.remove("d-none");
      setTimeout(() => okAlert.classList.add("d-none"), 5000);
    }

    form.reset();
  });
}


document.addEventListener("DOMContentLoaded", () => {
  $("rut")?.addEventListener("input", () => {
    $("rut").value = $("rut").value.replace(/\D+/g, "").slice(0,8);
  });
  $("dv")?.addEventListener("input", () => {
    $("dv").value = $("dv").value.replace(/[^0-9Kk]/g, "").slice(0,1).toUpperCase();
  });
  $("telefono")?.addEventListener("input", () => {
    $("telefono").value = $("telefono").value.replace(/\D+/g, "").slice(0,10);
  });

  // Regiones
fetch("assets/json/regiones.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    const select = document.getElementById("regiones");
    if (!select) return;

    const arr = data.regiones;
    if (!Array.isArray(arr)) throw new Error("El JSON no contiene un array 'regiones'");

    select.querySelectorAll("option:not([disabled])").forEach(opt => opt.remove());

    arr.forEach((nombre, idx) => {
      const option = document.createElement("option");
      option.value = String(idx + 1);
      option.textContent = nombre;
      select.appendChild(option);
    });

    console.log(`✔ Se cargaron ${arr.length} regiones en el select.`); //comece a usar isso com mais frequência
  })
  .catch((error) => {
    console.error("Error cargando regiones:", error);
    const alert = document.getElementById("errorAlert");
    if (alert) {
      alert.classList.remove("d-none");
      alert.textContent = "No se pudieron cargar las regiones.";
    }
  });

  const form = $("#form-registro");
  if(form){
    form.addEventListener("submit", manejarSubmitRegistro);
  }
});
