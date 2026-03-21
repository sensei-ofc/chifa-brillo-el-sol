export const MENU_API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AWDtjMU8cwgXU4hMVNIAecTr0F8EE-dexwcIj5FUk2jQX1Nkfcjzy0Pvhdokx2pebn_qoSqmv6ntkMaxfU0M6QmYWIRoIBQ-RDkvrzeTGeGzYRI-m1Lw1mNimlz2kb482C2YIGmdvdzmwlNkFduwzCRN2akJ4MpzxnW49RfykL_d_ilNJZeH31vzuttjETkTrv9JR6Wxjhx23fJrEoMVV6fuZtxVXnkjlrqCY7wfamKyF8sn3FeM1l14V2Jm95Hkf7OxBLeumdO-Os6utoUwqrPy5B_3tx0jfBDY-M6XDsQC&lib=MkK0oGYH_rWAO5uZvrFFF-7TI4cXDUyk2";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  imageUrl?: string;
  flavor?: string;
}

export async function fetchMenuFromApi(): Promise<MenuItem[]> {
  try {
    const response = await fetch(MENU_API_URL);
    if (!response.ok) throw new Error("Failed to fetch menu");
    const json = await response.json();

    if (!json.ok) throw new Error("API response not OK");

    const data = json.data;
    const allItems: MenuItem[] = [];

    // 1. Menú Diario
    if (data.seccion_menu_diario?.menu_diario) {
      data.seccion_menu_diario.menu_diario.forEach((item: any) => {
        allItems.push({
          id: item.codigo || Math.random().toString(36).substr(2, 9),
          name: item.nombre || item.plato,
          description: item.descripcion || "",
          price: Number(item.precio) || 0,
          category: "Menú Diario",
          imageUrl: item.urlImagen || "",
          flavor: item.sabor || ""
        });
      });
    }

    // 2. Carta Individual
    if (data.seccion_carta_individual?.menu) {
      data.seccion_carta_individual.menu.forEach((cat: any) => {
        cat.platos.forEach((item: any) => {
          allItems.push({
            id: item.codigo || Math.random().toString(36).substr(2, 9),
            name: item.nombre || item.plato,
            description: item.descripcion || "",
            price: Number(item.precio) || 0,
            category: "Carta",
            subCategory: cat.categoria,
            imageUrl: item.urlImagen || "",
            flavor: item.sabor || ""
          });
        });
      });
    }

    // 3. Banquetes y Paquetes
    if (data.seccion_banquetes_y_paquetes?.categorias) {
      data.seccion_banquetes_y_paquetes.categorias.forEach((cat: any) => {
        cat.paquetes.forEach((item: any) => {
          allItems.push({
            id: item.codigo || Math.random().toString(36).substr(2, 9),
            name: item.descripcion, // In banquetes, description is the name
            description: "Paquete variado imperial",
            price: Number(item.precio) || 0,
            category: "Banquetes",
            subCategory: cat.titulo,
            imageUrl: "",
            flavor: ""
          });
        });
      });
    }

    // 4. Familiares
    if (data.seccion_familiares?.menu_familiar) {
      data.seccion_familiares.menu_familiar.forEach((cat: any) => {
        cat.platos.forEach((item: any) => {
          allItems.push({
            id: item.codigo || Math.random().toString(36).substr(2, 9),
            name: item.nombre || item.plato,
            description: item.descripcion || "",
            price: Number(item.precio) || 0,
            category: "Familiares",
            subCategory: cat.categoria,
            imageUrl: item.urlImagen || "",
            flavor: item.sabor || ""
          });
        });
      });
    }

    return allItems;
  } catch (error) {
    console.error("Error fetching menu from API:", error);
    return [];
  }
}
