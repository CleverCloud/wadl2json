import com.typesafe.sbt.SbtStartScript._
import StartScriptKeys._

name := "wadl2json"

version := "1.0"

scalaVersion := "2.10.0"

libraryDependencies ++= Seq(
  "net.databinder.dispatch" %% "core" % "0.9.1",
  "net.liftweb" %% "lift-json" % "2.5-M4",
  "no.arktekk" %% "anti-xml" % "0.5.1",
  "org.scalaz" %% "scalaz-core" % "7.0.0-M7",
  "org.scalaz" %% "scalaz-effect" % "7.0.0-M7"
)

seq(startScriptForClassesSettings: _*)

startScriptFile <<= (baseDirectory, name)(_ / _)
