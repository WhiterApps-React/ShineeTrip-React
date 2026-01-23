import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2, X } from "lucide-react"
import { signInWithFacebook, signInWithGoogle } from "@/Firebase/firebasevalidation"
import { PhoneLoginForm } from "./phone.login.form"
import Logo from "../../assets/Logo.png"
import type { User } from "firebase/auth" // Using 'import type'
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { FaApple } from "react-icons/fa";
import { MdEmail } from "react-icons/md";



// Logo components for social login buttons
const GoogleLogo = () => <FcGoogle size={22} />;
const FacebookLogo = () => <FaFacebook size={22} color="#1877F2" />;
const AppleLogo = () => <FaApple size={22} />;
const EmailLogo = () => <MdEmail size={22} />;

// 🔹 PROFILE IMAGE DECIDER (Google image OR Letter avatar)
const getProfileImage = (user: User) => {
    // 1️⃣ Google / Firebase image available
    if (user.photoURL) {
        return user.photoURL;
    }


    const name = user.displayName || user.email || "User";
    const firstLetter = name.charAt(0).toUpperCase();

    return `https://ui-avatars.com/api/?name=${firstLetter}&size=256&background=0D8ABC&color=fff&bold=true`;
};



// === CHECK OR CREATE CUSTOMER IN DATABASE (UNCHANGED LOGIC) ===
// === CHECK OR CREATE CUSTOMER FUNCTION (FIXED 400 ERROR) ===
const checkOrCreateCustomer = async (user: User, token: string): Promise<number> => {

    // Search URL: Abhi bhi same rahega
    const customerSearchUrl = `http://46.62.160.188:3000/customers/0?email=${user.email}`;
    console.log("Logged in Firebase User Email:", user.email);

    let customerData: any = null;

    try {
        // --- 1. Search for existing customer ---
        const searchResponse = await fetch(customerSearchUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        // Replace this part in your code:
        if (searchResponse.ok) {
            const data = await searchResponse.json();

            // Agar data array hai toh pehla element le lo, nahi toh direct data use karo
            const customer = Array.isArray(data) ? data[0] : data;

            if (customer && customer.id) {
                console.log(`✅ User mil gaya! ID: ${customer.id}`);
                return customer.id;
            }
        }


        else if (searchResponse.status === 404) {
            console.log("Customer not found (404). Proceeding to create new one...");
        } else {
            console.warn(`Customer search failed with status: ${searchResponse.status}. Check API permissions/token.`);
        }
    } catch (e: any) {
        console.error("Error during customer search API call:", e);
        throw new Error("Search failed: " + e.message);
        return 0;
    }


    // --- 2. If not found, create a new customer record ---
    console.log("Attempting to create new customer...");
    const customerCreateUrl = `http://46.62.160.188:3000/customers`;

    const createPayload = {
        social_title: user.displayName ? (user.displayName.startsWith("Mr") ? "Mr." : "Ms.") : "Ms.",
        first_name: user.displayName?.split(' ')[0] || "Guest",
        last_name: user.displayName?.split(' ').slice(1).join(' ') || "User",
        email: user.email,
        phone: "",
        // 🚨 FIX: Add a unique placeholder password using Firebase UID 
        password: `FB_LOGIN_${user.uid}_TEMP`,
        profile_image: getProfileImage(user),
        firebase_uid: user.uid,
        enabled: true,
        default_group: 3
    };

    const createResponse = await fetch(customerCreateUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createPayload),
    });

    if (!createResponse.ok) {
        const err = await createResponse.text();
        console.error("❌ Failed to create customer:", err);

        throw new Error("Could not register user in database.");
    }

    const createdData = await createResponse.json();
    console.log(`✅ Customer created. DB ID: ${createdData.id}`);
    return createdData.id;
};

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [socialLoading, setSocialLoading] = useState<string | null>(null)

    const handleGoogleLogin = async () => {
        setSocialLoading("google");
        try {
            const user = await signInWithGoogle();
            if (!user) return;

            // 1. Get Firebase ID Token
            const token = await user.getIdToken();

            // 2. SAVE TOKEN IMMEDIATELY (FIX: Yeh line ab API call se pehle hai)
            sessionStorage.setItem("shineetrip_token", token);
            sessionStorage.setItem("shineetrip_uid", user.uid);
            if (user.displayName) sessionStorage.setItem("shineetrip_name", user.displayName);
            if (user.email) sessionStorage.setItem("shineetrip_email", user.email);
            sessionStorage.setItem(
                "shineetrip_profile_image",
                getProfileImage(user)
            );


            // DEBUGGING STEP: Token ko console pe print karo
            console.log("--- DEBUG: NEW AUTH TOKEN ---");
            console.log("Bearer Token:", token);
            console.log("------------------------------");

            // 3. Assign Roles AND Fetch/Create Customer DB Record

            // Attempt 1: Assign Roles (Need permission for POST /customers)
            const roleRes = await fetch(
                `http://46.62.160.188:3000/firebase-auth/set-roles/${user.uid}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ roles: ["USER"] }),
                }
            );

            if (!roleRes.ok) {
                console.warn(`Roles not set (Status: ${roleRes.status}). Proceeding with login.`);
            } else {
                console.log("✅ Roles assigned successfully");
            }

            try {
                const dbCustomerId = await checkOrCreateCustomer(user, token);

                sessionStorage.setItem("shineetrip_token", token);
                sessionStorage.setItem("shineetrip_db_customer_id", String(dbCustomerId));
                sessionStorage.setItem("shineetrip_name", user.displayName || "");

                onClose();
                window.location.reload();
            } catch (error) {


                console.error("Login sequence failed");
            }


            onClose();
        } catch (error: any) {
            console.error("Google sign-in failed:", error);
            alert(error.message || "Login failed. Please try again.");
        } finally {
            setSocialLoading(null);
        }
    };


    const handleFacebookLogin = async () => {
        setSocialLoading("facebook")
        try {
            const user = await signInWithFacebook()
            if (user) onClose()
        } catch (error: any) {
            alert("Facebook login failed.")
        } finally {
            setSocialLoading(null)
        }
    }

    const handleAppleLogin = async () => {
        setSocialLoading("apple")
        try {

            alert("Apple sign-in coming soon!")
        } catch (error: any) {
            alert("Apple login failed. Please try again.")
        } finally {
            setSocialLoading(null)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="p-0 border-0 max-w-md max-h-[90vh] z-90 overflow-y-auto font-opensans">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <img src={Logo} alt="Shinee Trip" className="h-8 w-auto" />
                        <h1 className="text-lg font-bold text-gray-900">Log In or Sign Up</h1>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to Shinee Trip</h2>

                    {/* Phone Login Form */}
                    <PhoneLoginForm onSuccess={onClose} />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={!!socialLoading}
                            className="w-full h-14 border-2 border-gray-900 rounded-lg flex items-center justify-start px-4 gap-3 hover:bg-gray-50 transition-colors font-semibold text-gray-900 disabled:opacity-50"
                        >
                            {socialLoading === "google" ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <GoogleLogo />
                            )}
                            Continue with Google
                        </button>

                        <button
                            onClick={handleAppleLogin}
                            disabled={!!socialLoading}
                            className="w-full h-14 border-2 border-gray-900 rounded-lg flex items-center justify-start px-4 gap-3 hover:bg-gray-50 transition-colors font-semibold text-gray-900 disabled:opacity-50"
                        >
                            {socialLoading === "apple" ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <AppleLogo />
                            )}
                            Continue with Apple
                        </button>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={!!socialLoading}
                            className="w-full h-14 border-2 border-gray-900 rounded-lg flex items-center justify-start px-4 gap-3 hover:bg-gray-50 transition-colors font-semibold text-gray-900 disabled:opacity-50"
                        >
                            <EmailLogo />
                            Continue with email
                        </button>

                        {/*             <button
              onClick={handleFacebookLogin}
              disabled={!!socialLoading}
              className="w-full h-14 border-2 border-gray-900 rounded-lg flex items-center justify-start px-4 gap-3 hover:bg-gray-50 transition-colors font-semibold text-gray-900 disabled:opacity-50"
            >
              {socialLoading === "facebook" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FacebookLogo />
              )}
              Continue with Facebook
            </button> */}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}