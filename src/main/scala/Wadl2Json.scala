package com.rbelouin.wadl2json

import com.codecommit.antixml._

import net.liftweb.json._

import scalaz._
import Scalaz._

object Wadl2Json {
  implicit val formats = DefaultFormats

  case class Param(name: String, style: String)
  type Path = String
  type Verb = String
  type Resource = Map[Verb, scala.collection.immutable.Seq[Param]]
  type Resources = Map[Path, Resource]

  def xml2param(e: Elem): Option[Param] = {
    List("name", "style") flatMap (e.attrs.get(_)) match {
      case List(name, style) => Param(name, style).some
      case _ => None
    }
  }

  def xml2resources(e: Elem): Resources = {
    val path = e.attrs.getOrElse("path", "")
    val params = (e \ "param").toList.flatMap(xml2param _).toSeq

    val resource = (e \ "method").toList.flatMap(m => {
      m.attrs.get("name").map(_ -> (params ++ (m \\ "param").toList.flatMap(xml2param _).toSeq))
    }).toMap

    val resources = (e \ "resource").toList.foldLeft(Map(path -> resource)) {
      case (rr, e) => rr ++ (xml2resources(e)).toList.map {
        case (p, r) => (path + "/" + p) -> r.mapValues(_ ++ params)
      }.toMap
    }

    resources.filter(_._2.size > 0)
  }

  def fromXML(e: Elem): String = {
    Serialization.writePretty((e \\ "resources").headOption.map(xml2resources _).getOrElse(Map.empty))
  }
}
