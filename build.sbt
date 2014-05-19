name := "room-sandbox"

version := "1.0-SNAPSHOT"

resolvers += "Flect repo" at "http://flect.github.io/maven-repo/"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
  "roomframework" %% "roomframework" % "0.9.1"
)     

play.Project.playScalaSettings
