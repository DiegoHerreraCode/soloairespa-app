export const CustomFullScreenLoading = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h1 className="text-xl font-semibold text-muted-foreground">Cargando...</h1>
      </div>
    </div>
  );
};
