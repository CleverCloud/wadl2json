package com.rbelouin.wadl2json

import com.codecommit.antixml._

import net.liftweb.json._

import scalaz._
import Scalaz._

object Wadl2Json {
  implicit val formats = DefaultFormats

  type Path = String
  type Verb = String

  case class Param(name: String, style: String)
  case class Method(verb: Verb, name: String, params: List[Param])
  case class Resource(path: Path, methods: List[Method])

  def xml2param(e: Elem): Option[Param] = for {
    name <- e.attrs.get("name")
    style <- e.attrs.get("style")
  } yield Param(name, style)

  def xml2method(e: Elem, inheritedParams: List[Param]): Option[Method] = for {
    verb <- e.attrs.get("name")
    id <- e.attrs.get("id")
    params <- (e \\ "param").toList.flatMap(xml2param _).some
  } yield Method(verb, id, inheritedParams ++ params)

  def xml2resources(e: Elem, inheritedPath: Option[Path]): List[Resource] = {
    val path = (inheritedPath.map(_ + "/") | "") + e.attrs.getOrElse("path", "")
    val params = (e \ "param").toList.flatMap(xml2param _)

    val resource = Resource(path, (e \ "method").toList.flatMap(xml2method(_, params)))
    val resources = (e \ "resource").toList.flatMap(xml2resources(_, path.some))

    (resource :: resources).filter(_.methods.size > 0)
  }

  def resources2map(resources: List[Resource]): Map[Path, List[Method]] = {
    resources.map(resource => resource.path -> resource.methods).toMap
  }

  def fromXML(e: Elem): String = {
    val resources: List[Resource] = (e \\ "resources").toList.flatMap(xml2resources(_, none))
    val resourcesMap: Map[Path, List[Method]] = resources2map(resources)

    Serialization.writePretty(resourcesMap)
  }
}
