const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-1">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
