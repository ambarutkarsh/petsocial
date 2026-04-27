import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/petosauras-logo.png";

interface GuestPopupContextType {
  triggerGuestPopup: () => void;
}

const GuestPopupContext = createContext<GuestPopupContextType>({
  triggerGuestPopup: () => {},
});

export const useGuestPopup = () => useContext(GuestPopupContext);

export const GuestPopupProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const triggerGuestPopup = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <GuestPopupContext.Provider value={{ triggerGuestPopup }}>
      {children}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 flex items-center justify-center px-6"
          style={{ zIndex: 3000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-[24px] w-full max-w-[360px] p-6 text-center animate-fade-up shadow-2xl"
          >
            <img src={logo} alt="Petosauras" className="h-12 w-auto mx-auto mb-3" />
            <h2 className="font-heading font-bold text-xl mb-2">Join Petosauras 🦕</h2>
            <p className="text-sm text-muted-foreground font-body mb-5">
              To access this feature, you need to login/register.
            </p>
            <button
              onClick={() => {
                close();
                navigate("/auth");
              }}
              style={{
                width: "100%",
                background: "#1B2A4A",
                color: "white",
                border: "none",
                borderRadius: 50,
                padding: "13px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              Login / Register
            </button>
            <button
              onClick={close}
              className="text-sm text-muted-foreground font-body font-semibold"
            >
              Continue browsing
            </button>
          </div>
        </div>
      )}
    </GuestPopupContext.Provider>
  );
};
