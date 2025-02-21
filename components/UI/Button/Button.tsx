import styles from "./Button.module.css";

type Props = {
  children: React.ReactNode;
  onClick: () => void;
};

export const Button = ({ children, onClick }: Props) => {
  return (
    <button type="button" onClick={onClick} className={styles.primary}>
      {children}
    </button>
  );
};
