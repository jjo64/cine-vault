import { z } from 'zod';

const userSchema = z.object({
    username: z.string().trim().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
    email: z.email("El correo debe tener un formato válido").trim(),
    password: z.string().trim().min(6, "La contraseña debe tener al menos 6 caracteres")
});

function validateUser(data: any) {
    const result = userSchema.safeParse(data);

    if (!result.success) {
        return { 
            success: false, 
            errorMessages: result.error.issues.map(err => err.message) 
        };
    }

    return { success: true, data: result.data };
}

export { validateUser };
