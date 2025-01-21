import Image from "next/image";

function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "Verdana",
        alignItems: "center",
        justifyContent: "center",
        width: "80%",
        maxWidth: "650px",
        margin: "auto",
        textAlign: "center",
        marginTop: "35dvh",
        overflowY: "hidden",
      }}
    >
      <Image
        src="/assets/logo-black.png"
        width={200}
        height={62.15}
        alt="Logo do CinemaTab"
      />
      <p>
        Eu não sei você, mas eu <b>amo assistir filmes</b> (e séries também) e
        <b>conhecer novas histórias.</b> Outra coisa tão legal quanto, é
        <b>conversar com o pessoal</b> que também gosta e ainda pode{" "}
        <b>indicar novas histórias</b> para a gente conhecer..
      </p>
      <p>
        É por isso que o <b>CinemaTab tá sendo criado</b>, topa me ajudar a
        construir esse local bacana ?
      </p>
    </div>
  );
}

export default Home;
